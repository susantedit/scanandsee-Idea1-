import { getGeminiModel } from '../config/gemini.js';
import { buildAnalysisPrompt } from '../prompts/analyze.prompt.js';
import { COMPARE_PROMPT } from '../prompts/compare.prompt.js';
import { buildChatPrompt } from '../prompts/chat.prompt.js';
import { AnalysisSchema } from '../schemas/scan.schema.js';
import { ComparisonResultSchema } from '../schemas/compare.schema.js';
import { ChatResponseSchema } from '../schemas/chat.schema.js';
import { imageToGeminiPart } from './image.service.js';
import { withRetry, extractJson } from '../utils/helpers.js';
import { badGateway } from '../utils/apiError.js';
import logger from '../utils/logger.js';

/**
 * Analyze a food image using Gemini Vision.
 * @param {Buffer} imageBuffer - processed JPEG buffer
 * @param {{ gymMode?: boolean, userGoal?: string, personality?: string }} options
 * @returns {Promise<object>} validated AnalysisSchema object
 */
export async function analyzeFood(imageBuffer, options = {}) {
  const model = getGeminiModel();
  const prompt = buildAnalysisPrompt(options);
  const imagePart = imageToGeminiPart(imageBuffer);

  const raw = await withRetry(async () => {
    logger.debug('Calling Gemini Vision API for food analysis...');
    const result = await model.generateContent({
      contents: [{ parts: [{ text: prompt }, imagePart] }],
      generationConfig: { responseMimeType: 'application/json' },
    });
    return result.response.text();
  }, 3, 1000);

  const parsed = extractJson(raw);
  if (!parsed) {
    logger.error('Gemini returned non-JSON response', { raw: raw.slice(0, 200) });
    throw badGateway('AI returned an invalid response. Please try again.');
  }

  const validated = AnalysisSchema.safeParse(parsed);
  if (!validated.success) {
    logger.warn('Gemini response failed schema validation', {
      issues: validated.error.issues,
      raw: JSON.stringify(parsed).slice(0, 300),
    });
    // Attempt to use partial data with defaults
    const partial = AnalysisSchema.partial().safeParse(parsed);
    if (partial.success) return { ...getDefaultAnalysis(), ...partial.data };
    throw badGateway('AI response was incomplete. Please try again.');
  }

  logger.debug(`Analysis complete: ${validated.data.food_name} (score: ${validated.data.health_score})`);
  return validated.data;
}

/**
 * Compare two food products using Gemini Vision.
 * @param {Buffer} imageBufferA
 * @param {Buffer} imageBufferB
 * @returns {Promise<object>} validated ComparisonResultSchema object
 */
export async function compareProducts(imageBufferA, imageBufferB) {
  const model = getGeminiModel();
  const imagePartA = imageToGeminiPart(imageBufferA);
  const imagePartB = imageToGeminiPart(imageBufferB);

  const raw = await withRetry(async () => {
    logger.debug('Calling Gemini Vision API for product comparison...');
    const result = await model.generateContent({
      contents: [{
        parts: [
          { text: COMPARE_PROMPT },
          imagePartA,
          imagePartB,
        ],
      }],
      generationConfig: { responseMimeType: 'application/json' },
    });
    return result.response.text();
  }, 3, 1000);

  const parsed = extractJson(raw);
  if (!parsed) throw badGateway('AI comparison failed. Please try again.');

  const validated = ComparisonResultSchema.safeParse(parsed);
  if (!validated.success) {
    logger.warn('Comparison schema validation failed', { issues: validated.error.issues });
    throw badGateway('AI comparison response was incomplete. Please try again.');
  }

  return validated.data;
}

/**
 * Answer a food-related question using Gemini.
 * @param {string} question
 * @param {object|null} scanContext - optional scan result for context
 * @param {string} persona
 * @returns {Promise<{ answer: string, suggestions: string[] }>}
 */
export async function chatAboutFood(question, scanContext = null, persona = 'coach') {
  const model = getGeminiModel();
  const prompt = buildChatPrompt(question, scanContext, persona);

  const raw = await withRetry(async () => {
    logger.debug('Calling Gemini for chat response...');
    const result = await model.generateContent({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: 'application/json' },
    });
    return result.response.text();
  }, 3, 1000);

  const parsed = extractJson(raw);
  if (!parsed) throw badGateway('AI chat failed. Please try again.');

  const validated = ChatResponseSchema.safeParse(parsed);
  if (!validated.success) {
    return { answer: parsed.answer || 'I could not process that question.', suggestions: [] };
  }

  return validated.data;
}

// ── Fallback default analysis ─────────────────────────────────────────────────
function getDefaultAnalysis() {
  return {
    food_name: 'Unknown Food',
    health_score: 5.0,
    verdict: 'MODERATE',
    calories: 0,
    protein_g: 0,
    carbs_g: 0,
    fats_g: 0,
    sugar_g: 0,
    sodium_mg: 0,
    fiber_g: 0,
    serving_size: '1 serving',
    ingredients: [],
    warnings: [],
    improvements: ['Please try scanning again with a clearer image.'],
    voice_explanation: 'I had trouble analyzing this food. Please try again with a clearer image.',
  };
}
