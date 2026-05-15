/**
 * AI service — Gemini for vision, Groq for text.
 *
 * Gemini 2.0 Flash   → analyzeFood, compareProducts  (need image input)
 * Groq llama-3.3-70b → chatAboutFood  (text-only, faster, higher limits)
 */
import { getGeminiModel } from '../config/gemini.js';
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

// ── GEMINI — Vision tasks (image required) ────────────────────────────────────

export async function analyzeFood(imageBuffer, options = {}) {
  const model     = getGeminiModel();
  const prompt    = buildAnalysisPrompt(options);
  const imagePart = imageToGeminiPart(imageBuffer);

  let raw;
  try {
    raw = await withRetry(async () => {
      logger.debug('Gemini Vision: food analysis');
      const result = await model.generateContent({
        contents: [{ parts: [{ text: prompt }, imagePart] }],
        generationConfig: { responseMimeType: 'application/json' },
      });
      return result.response.text();
    }, 3, 1000);
  } catch (err) {
    const msg = (err?.message || '').toLowerCase();
    const retryMatch = (err?.message || '').match(/Please retry in\s*(\d+(?:\.\d+)?)s/i);
    const retryIn = retryMatch ? Math.ceil(Number(retryMatch[1])) : undefined;
    if (msg.includes('quota') || msg.includes('too many requests') || err?.status === 429) {
      throw tooManyReqs(
        'Gemini quota exceeded. Please wait a moment and try again.',
        retryIn ? { retryInSeconds: retryIn } : undefined
      );
    }
    throw err;
  }

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

export async function compareProducts(imageBufferA, imageBufferB) {
  const model      = getGeminiModel();
  const imagePartA = imageToGeminiPart(imageBufferA);
  const imagePartB = imageToGeminiPart(imageBufferB);

  const raw = await withRetry(async () => {
    logger.debug('Gemini Vision: product comparison');
    const result = await model.generateContent({
      contents: [{ parts: [{ text: COMPARE_PROMPT }, imagePartA, imagePartB] }],
      generationConfig: { responseMimeType: 'application/json' },
    });
    return result.response.text();
  }, 3, 1000);

  const parsed = extractJson(raw);
  if (!parsed) throw badGateway('AI comparison failed. Please try again.');

  const validated = ComparisonResultSchema.safeParse(parsed);
  if (!validated.success) {
    logger.warn('Comparison schema failed', { issues: validated.error.issues });
    throw badGateway('AI comparison response was incomplete. Please try again.');
  }

  return validated.data;
}

// ── GROQ — Text tasks (no image, fast + high limits) ─────────────────────────

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
    food_name: 'Unknown Food', health_score: 5.0, verdict: 'MODERATE',
    calories: 0, protein_g: 0, carbs_g: 0, fats_g: 0,
    sugar_g: 0, sodium_mg: 0, fiber_g: 0, serving_size: '1 serving',
    ingredients: [], warnings: [],
    improvements: ['Please try scanning again with a clearer image.'],
    voice_explanation: 'I had trouble analyzing this food. Please try again with a clearer image.',
  };
}
