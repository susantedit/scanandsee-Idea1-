/**
 * Groq client with multi-key rotation.
 *
 * Add multiple keys in .env as:
 *   GROQ_API_KEY_1=gsk_...
 *   GROQ_API_KEY_2=gsk_...
 *   GROQ_API_KEY_3=gsk_...
 *
 * Keys are rotated round-robin on every call.
 * On 429, the current key is marked as cooling down for 60s
 * and the next available key is tried automatically.
 */
import Groq from 'groq-sdk';
import logger from '../utils/logger.js';

// ── Key pool ──────────────────────────────────────────────────────────────────

function loadKeys() {
  const keys = [];
  // Support GROQ_API_KEY (single) or GROQ_API_KEY_1..N (multiple)
  if (process.env.GROQ_API_KEY) keys.push(process.env.GROQ_API_KEY);
  for (let i = 1; i <= 20; i++) {
    const k = process.env[`GROQ_API_KEY_${i}`];
    if (k) keys.push(k);
  }
  return [...new Set(keys)]; // deduplicate
}

// Track cooldown per key: key → timestamp when cooldown expires
const cooldowns = new Map();
const COOLDOWN_MS = 65_000; // 65 seconds after a 429

let currentIndex = 0;
let clients = [];

/**
 * Initialize all Groq clients from env keys.
 */
export function initGroq() {
  const keys = loadKeys();
  if (keys.length === 0) {
    logger.warn('No GROQ_API_KEY found — text AI features will use Gemini fallback');
    return;
  }
  clients = keys.map(k => new Groq({ apiKey: k }));
  logger.info(`Groq initialized — ${clients.length} key(s) loaded`);
}

/**
 * Get the next available Groq client (round-robin, skips cooling keys).
 * Throws if all keys are cooling down.
 */
export function getGroqClient() {
  if (clients.length === 0) return null; // no keys — caller falls back to Gemini

  const now = Date.now();
  const keys = loadKeys();

  // Find next non-cooling key
  for (let attempt = 0; attempt < clients.length; attempt++) {
    const idx = (currentIndex + attempt) % clients.length;
    const key = keys[idx];
    const coolUntil = cooldowns.get(key) || 0;

    if (now >= coolUntil) {
      currentIndex = (idx + 1) % clients.length; // advance for next call
      return { client: clients[idx], key };
    }
  }

  // All keys cooling — find the one that recovers soonest
  const soonest = Math.min(...[...cooldowns.values()]);
  const waitSec = Math.ceil((soonest - now) / 1000);
  logger.warn(`All Groq keys cooling. Soonest recovery in ${waitSec}s`);
  throw new Error(`GROQ_ALL_COOLING:${waitSec}`);
}

/**
 * Mark a key as cooling after a 429.
 */
export function markKeyCooling(key) {
  cooldowns.set(key, Date.now() + COOLDOWN_MS);
  logger.warn(`Groq key marked cooling for ${COOLDOWN_MS / 1000}s`, {
    key: key.slice(0, 8) + '...',
  });
}

/**
 * How many keys are currently available (not cooling).
 */
export function availableKeyCount() {
  const now = Date.now();
  const keys = loadKeys();
  return keys.filter(k => (cooldowns.get(k) || 0) <= now).length;
}

export const GROQ_MODEL = 'llama-3.3-70b-versatile'; // best free model for JSON tasks
