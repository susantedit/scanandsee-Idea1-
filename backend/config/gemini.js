import { GoogleGenerativeAI } from '@google/generative-ai';
import { GEMINI_MODEL } from './constants.js';
import logger from '../utils/logger.js';

let geminiClient = null;

/**
 * Initialize Gemini client (singleton).
 */
export function initGemini() {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    logger.warn('GEMINI_API_KEY not set — AI features will not work');
    return null;
  }

  geminiClient = new GoogleGenerativeAI(apiKey);
  logger.info(`Gemini client initialized — model: ${GEMINI_MODEL}`);
  return geminiClient;
}

/**
 * Get a Gemini generative model instance.
 * @param {string} model - model name (defaults to GEMINI_MODEL constant)
 */
export function getGeminiModel(model = GEMINI_MODEL) {
  if (!geminiClient) {
    throw new Error('Gemini client not initialized. Call initGemini() first.');
  }
  return geminiClient.getGenerativeModel({ model });
}

export { geminiClient };
