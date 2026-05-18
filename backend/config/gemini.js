/**
 * Gemini client with multi-key rotation.
 *
 * Add multiple keys in .env as:
 *   GEMINI_API_KEY_1=AIzaSy...
 *   GEMINI_API_KEY_2=AIzaSy...
 *   GEMINI_API_KEY_3=AIzaSy...
 *
 * Keys rotate round-robin. On 429, current key cools for 65s,
 * next available key is used automatically.
 *
 * Free tier: 15 RPM per key. 5 keys = 75 RPM total.
 * Get keys at: aistudio.google.com/apikey
 */
import { GoogleGenerativeAI } from '@google/generative-ai';
import { GEMINI_MODEL } from './constants.js';
import logger from '../utils/logger.js';

const COOLDOWN_MS = 65_000; // 65s after a 429

let clients      = [];
let keys         = [];
let currentIndex = 0;
const cooldowns  = new Map();

function loadKeys() {
  const found = [];
  // Support GEMINI_API_KEY_1..N or single GEMINI_API_KEY
  for (let i = 1; i <= 20; i++) {
    const k = process.env[`GEMINI_API_KEY_${i}`];
    if (k && k.length > 10) found.push(k);
  }
  // Fallback to single key
  if (found.length === 0 && process.env.GEMINI_API_KEY) {
    found.push(process.env.GEMINI_API_KEY);
  }
  return [...new Set(found)];
}

export function initGemini() {
  keys    = loadKeys();
  clients = keys.map(k => new GoogleGenerativeAI(k));

  if (clients.length === 0) {
    logger.warn('No GEMINI_API_KEY found — vision AI features will not work');
    return;
  }
  logger.info(`Gemini initialized — ${clients.length} key(s) loaded, model: ${GEMINI_MODEL}`);
}

/**
 * Get next available Gemini model instance (round-robin, skips cooling keys).
 * Throws if all keys are cooling.
 */
export function getGeminiModel(model = GEMINI_MODEL) {
  if (clients.length === 0) {
    throw new Error('Gemini not initialized. Call initGemini() first.');
  }

  const now = Date.now();

  for (let attempt = 0; attempt < clients.length; attempt++) {
    const idx      = (currentIndex + attempt) % clients.length;
    const key      = keys[idx];
    const coolUntil = cooldowns.get(key) || 0;

    if (now >= coolUntil) {
      currentIndex = (idx + 1) % clients.length;
      return clients[idx].getGenerativeModel({ model });
    }
  }

  // All cooling — find soonest recovery
  const soonest = Math.min(...[...cooldowns.values()]);
  const waitSec = Math.ceil((soonest - now) / 1000);
  logger.warn(`All Gemini keys cooling. Soonest recovery in ${waitSec}s`);
  throw Object.assign(new Error(`All Gemini keys are rate limited. Retry in ${waitSec}s.`), {
    status: 429,
    details: { retryInSeconds: waitSec },
  });
}

/**
 * Mark a key as cooling after a 429.
 * Called by gemini.service.js when it catches a 429.
 */
export function markGeminiKeyCooling(keyIndex) {
  if (keyIndex >= 0 && keyIndex < keys.length) {
    cooldowns.set(keys[keyIndex], Date.now() + COOLDOWN_MS);
    logger.warn(`Gemini key ${keyIndex + 1} cooling for ${COOLDOWN_MS / 1000}s`);
  }
}

/**
 * Get current key index being used (for cooling on 429).
 */
export function getCurrentKeyIndex() {
  return (currentIndex - 1 + clients.length) % clients.length;
}

export { GEMINI_MODEL };
