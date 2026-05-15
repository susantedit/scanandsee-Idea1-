/**
 * Groq text AI service.
 *
 * Handles all text-only AI tasks:
 * - Chat / Q&A
 * - Mood & brain analysis
 * - Budget meal optimizer
 * - Health risk prediction
 * - Voice explanation generation
 *
 * Uses multi-key rotation with automatic 429 handling.
 * Falls back to Gemini text if all Groq keys are cooling.
 */
import { getGroqClient, markKeyCooling, GROQ_MODEL } from '../config/groq.js';
import { getGeminiModel } from '../config/gemini.js';
import { extractJson, withRetry } from '../utils/helpers.js';
import { badGateway, tooManyReqs } from '../utils/apiError.js';
import logger from '../utils/logger.js';

/**
 * Send a text prompt to Groq and return the raw response string.
 * Automatically rotates keys on 429.
 *
 * @param {string} prompt
 * @param {object} options
 * @param {number} options.maxTokens
 * @param {number} options.temperature
 * @returns {Promise<string>} raw text response
 */
export async function groqText(prompt, options = {}) {
  const { maxTokens = 1024, temperature = 0.3 } = options;

  // Try Groq with key rotation
  let lastError;
  const maxAttempts = 5; // try up to 5 different keys

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    let keyInfo;
    try {
      keyInfo = getGroqClient();
    } catch (err) {
      // All keys cooling — fall back to Gemini
      if (err.message?.startsWith('GROQ_ALL_COOLING:')) {
        const waitSec = parseInt(err.message.split(':')[1]) || 60;
        logger.warn(`All Groq keys cooling — falling back to Gemini text (wait ${waitSec}s)`);
        return geminiTextFallback(prompt, options);
      }
      throw err;
    }

    if (!keyInfo) {
      // No Groq keys configured — use Gemini
      return geminiTextFallback(prompt, options);
    }

    const { client, key } = keyInfo;

    try {
      logger.debug(`Groq text call (key: ${key.slice(0, 8)}...)`);

      const completion = await client.chat.completions.create({
        model:       GROQ_MODEL,
        messages:    [{ role: 'user', content: prompt }],
        max_tokens:  maxTokens,
        temperature,
        response_format: { type: 'json_object' }, // force JSON output
      });

      const text = completion.choices[0]?.message?.content || '';
      logger.debug(`Groq response received (${text.length} chars)`);
      return text;

    } catch (err) {
      lastError = err;
      const status = err?.status || err?.error?.status;

      if (status === 429) {
        markKeyCooling(key);
        logger.warn(`Groq 429 on key ${key.slice(0, 8)}... — rotating to next key`);
        continue; // try next key
      }

      // Non-429 error — don't retry with different key
      logger.error('Groq API error', { error: err.message, status });
      throw badGateway('AI service error. Please try again.');
    }
  }

  // All attempts exhausted — fall back to Gemini
  logger.warn('All Groq key attempts exhausted — falling back to Gemini text');
  return geminiTextFallback(prompt, options);
}

/**
 * Gemini text fallback (no vision, text-only mode).
 * Used when all Groq keys are cooling.
 */
async function geminiTextFallback(prompt, options = {}) {
  try {
    const model = getGeminiModel();
    const result = await model.generateContent({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: 'application/json',
        maxOutputTokens: options.maxTokens || 1024,
        temperature: options.temperature || 0.3,
      },
    });
    return result.response.text();
  } catch (err) {
    const msg = (err?.message || '').toLowerCase();
    if (msg.includes('quota') || msg.includes('too many') || err?.status === 429) {
      throw tooManyReqs('All AI services are rate limited. Please wait a moment and try again.', { retryInSeconds: 60 });
    }
    throw badGateway('AI service temporarily unavailable. Please try again.');
  }
}

/**
 * Convenience: send prompt, parse JSON, return object.
 * @param {string} prompt
 * @param {object} options
 * @returns {Promise<object>}
 */
export async function groqJson(prompt, options = {}) {
  const raw = await groqText(prompt, options);
  const parsed = extractJson(raw);
  if (!parsed) {
    logger.error('Groq returned non-JSON', { raw: raw.slice(0, 200) });
    throw badGateway('AI returned an invalid response. Please try again.');
  }
  return parsed;
}
