/**
 * AI service — Gemini for vision (with key rotation), Groq for text.
 *
 * Gemini keys rotate automatically on 429.
 * Add more keys in .env as GEMINI_API_KEY_1, GEMINI_API_KEY_2, etc.
 */
import { getGeminiModel, markGeminiKeyCooling, getCurrentKeyIndex } from '../config/gemini.js';
import { groqJson } from './groq.service.js';
import { buildAnalysisPrompt } from '../prompts/analyze.prompt.js';
import { COMPARE_PROMPT } from '../prompts/compare.prompt.js';
import { buildChatPrompt } from '../prompts/chat.prompt.js';
import { AnalysisSchema } from '../schemas/scan.schema.js';
import { ComparisonResultSchema } from '../schemas/compare.schema.js';
import { ChatResponseSchema } from '../schemas/chat.schema.js';
import { imageToGeminiPart } from './image.service.js';
import { withRetry, extractJson } from '../utils/helpers.js';
import { tooManyReqs, badGateway } from '../utils/apiError.js';
import logger from '../utils/logger.js';

// ── Vision with key rotation ──────────────────────────────────────────────────

async function callGeminiVision(parts, retries = 3) {
  let lastErr;
  for (let attempt = 0; attempt < retries; attempt++) {
    let keyIdx;
    try {
      keyIdx = getCurrentKeyIndex();
      const model = getGeminiModel();
      const result = await model.generateContent({
        contents: [{ parts }],
        generationConfig: { responseMimeType: 'application/json' },
      });
      return result.response.text();
    } catch (err) {
      lastErr = err;
      const msg = (err?.message || '').toLowerCase();
      const is429 = msg.includes('429') || msg.includes('quota') || msg.includes('too many');

      if (is429) {
        markGeminiKeyCooling(keyIdx ?? 0);
        logger.warn(`Gemini 429 on key ${(keyIdx ?? 0) + 1} — rotating`);
        // Small delay before trying next key
        await new Promise(r => setTimeout(r, 500));
        continue;
      }
      throw err; // non-429 — don't retry
    }
  }

  // All retries exhausted
  const msg = lastErr?.message || '';
  if (msg.includes('429') || msg.includes('quota')) {
    const retryMatch = msg.match(/retry in\s*(\d+(?:\.\d+)?)s/i);
    const retryIn = retryMatch ? Math.ceil(Number(retryMatch[1])) : 60;
    throw tooManyReqs(
      'All Gemini keys are rate limited. Please wait a moment and try again.',
      { retryInSeconds: retryIn }
    );
  }
  throw lastErr || badGateway('Gemini vision failed. Please try again.');
}

// ── analyzeFood ───────────────────────────────────────────────────────────────

export async function analyzeFood(imageBuffer, options = {}) {
  const prompt    = buildAnalysisPrompt(options);
  const imagePart = imageToGeminiPart(imageBuffer);

  logger.debug('Gemini Vision: food analysis');
  const raw = await callGeminiVision([{ text: prompt }, imagePart]);

  const parsed = extractJson(raw);
  if (!parsed) {
    logger.error('Gemini non-JSON response', { raw: raw.slice(0, 200) });
    throw badGateway('AI returned an invalid response. Please try again.');
  }

  const validated = AnalysisSchema.safeParse(parsed);
  if (!validated.success) {
    logger.warn('Gemini schema validation failed', { issues: validated.error.issues });
    const partial = AnalysisSchema.partial().safeParse(parsed);
    if (partial.success) return { ...getDefaultAnalysis(), ...partial.data };
    throw badGateway('AI response was incomplete. Please try again.');
  }

  logger.debug(`Analysis: ${validated.data.food_name} (score: ${validated.data.health_score})`);
  return validated.data;
}

// ── compareProducts ───────────────────────────────────────────────────────────

export async function compareProducts(imageBufferA, imageBufferB) {
  const imagePartA = imageToGeminiPart(imageBufferA);
  const imagePartB = imageToGeminiPart(imageBufferB);

  logger.debug('Gemini Vision: product comparison');
  const raw = await callGeminiVision([{ text: COMPARE_PROMPT }, imagePartA, imagePartB]);

  const parsed = extractJson(raw);
  if (!parsed) throw badGateway('AI comparison failed. Please try again.');

  const validated = ComparisonResultSchema.safeParse(parsed);
  if (!validated.success) {
    logger.warn('Comparison schema failed', { issues: validated.error.issues });
    throw badGateway('AI comparison response was incomplete. Please try again.');
  }

  return validated.data;
}

// ── chatAboutFood (Groq) ──────────────────────────────────────────────────────

export async function chatAboutFood(question, scanContext = null, persona = 'coach') {
  const prompt = buildChatPrompt(question, scanContext, persona);
  logger.debug('Groq: chat response');
  const parsed = await groqJson(prompt, { maxTokens: 512, temperature: 0.4 });
  const validated = ChatResponseSchema.safeParse(parsed);
  if (!validated.success) {
    return { answer: parsed.answer || 'I could not process that question.', suggestions: [] };
  }
  return validated.data;
}

// ── Default fallback ──────────────────────────────────────────────────────────
function getDefaultAnalysis() {
  return {
    food_name: 'Unknown', health_score: 5.0, verdict: 'MODERATE',
    calories: 0, protein_g: 0, carbs_g: 0, fats_g: 0,
    sugar_g: 0, sodium_mg: 0, fiber_g: 0, serving_size: '1 serving',
    ingredients: [], warnings: [], improvements: ['Please try again with a clearer image.'],
    voice_explanation: 'I had trouble analyzing this. Please try again with a clearer image.',
    body_consequences: [], score_reason: '', fun_facts: [], confidence: 0,
  };
}
