// ── Rate limit windows (ms) ───────────────────────────────────────────────────
export const WINDOW_GLOBAL_MS  = 15 * 60 * 1000;  // 15 minutes
export const WINDOW_SCAN_MS    = 60 * 60 * 1000;  // 1 hour
export const WINDOW_VOICE_MS   = 60 * 60 * 1000;  // 1 hour
export const WINDOW_CHAT_MS    = 60 * 60 * 1000;  // 1 hour
export const WINDOW_COMPARE_MS = 60 * 60 * 1000;  // 1 hour

// ── Rate limits per tier ──────────────────────────────────────────────────────
export const LIMIT_GLOBAL_FREE     = 100;
export const LIMIT_GLOBAL_PREMIUM  = 500;
export const LIMIT_SCAN_FREE       = parseInt(process.env.FREE_SCAN_LIMIT)    || 5;
export const LIMIT_SCAN_PREMIUM    = parseInt(process.env.PREMIUM_SCAN_LIMIT) || 50;
export const LIMIT_VOICE_FREE      = parseInt(process.env.FREE_VOICE_LIMIT)   || 10;
export const LIMIT_VOICE_PREMIUM   = 100;
export const LIMIT_CHAT_FREE       = parseInt(process.env.FREE_CHAT_LIMIT)    || 20;
export const LIMIT_CHAT_PREMIUM    = 200;
export const LIMIT_COMPARE_FREE    = parseInt(process.env.FREE_COMPARE_LIMIT) || 3;
export const LIMIT_COMPARE_PREMIUM = 30;

// ── Image processing ──────────────────────────────────────────────────────────
export const IMAGE_MAX_WIDTH    = 1024;   // px
export const IMAGE_JPEG_QUALITY = 80;     // %
export const IMAGE_MAX_SIZE_MB  = 10;     // MB — multer upload limit
export const IMAGE_MAX_SIZE_B   = IMAGE_MAX_SIZE_MB * 1024 * 1024;
export const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];

// ── Cache TTLs (seconds) ──────────────────────────────────────────────────────
export const CACHE_TTL_USDA     = 24 * 60 * 60;  // 24 hours
export const CACHE_TTL_BARCODE  = 7  * 24 * 60 * 60; // 7 days
export const CACHE_TTL_VOICES   = 60 * 60;        // 1 hour
export const CACHE_TTL_PROFILE  = 5  * 60;        // 5 minutes

// ── Health score algorithm weights ───────────────────────────────────────────
export const SCORE_BASE = 5;
export const SCORE_MODIFIERS = {
  // Positive
  HIGH_PROTEIN:        +1.0,  // >20g per serving
  GOOD_FIBER:          +0.5,  // >5g
  LOW_SUGAR:           +0.5,  // <5g
  LOW_SODIUM:          +0.5,  // <400mg
  NO_DANGEROUS_ADDITIVE: +0.5,
  HAS_VITAMINS:        +0.5,
  WHOLE_FOOD:          +0.5,
  // Negative
  DANGEROUS_ADDITIVE:  -1.0,
  HIGH_SUGAR:          -0.5,  // >15g
  HIGH_SODIUM:         -0.5,  // >800mg
  TRANS_FATS:          -0.5,
  VERY_LOW_PROTEIN:    -0.5,  // <3g
  ULTRA_PROCESSED:     -0.5,
  MULTIPLE_WARNINGS:   -1.0,  // 3+ warnings
};

// ── AI Personas ───────────────────────────────────────────────────────────────
export const AI_PERSONAS = {
  doctor: {
    id: 'doctor',
    label: 'Dr. Nutrition',
    description: 'Professional, evidence-based medical advice',
    voiceStyle: 'professional',
  },
  gym_bro: {
    id: 'gym_bro',
    label: 'Gym Bro',
    description: 'Enthusiastic fitness bro energy',
    voiceStyle: 'energetic',
  },
  coach: {
    id: 'coach',
    label: 'Coach',
    description: 'Motivational sports coach',
    voiceStyle: 'motivational',
  },
  savage_roast: {
    id: 'savage_roast',
    label: 'Savage Roast',
    description: 'Brutally honest and funny',
    voiceStyle: 'roast',
  },
};

// ── User Goals ────────────────────────────────────────────────────────────────
export const USER_GOALS = [
  'weight_loss',
  'muscle_gain',
  'bulking',
  'cutting',
  'healthy_eating',
  'diabetic',
  'student_budget',
];

// ── Activity Levels ───────────────────────────────────────────────────────────
export const ACTIVITY_LEVELS = ['sedentary', 'light', 'moderate', 'active', 'athlete'];

// ── User Tiers ────────────────────────────────────────────────────────────────
export const TIERS = { FREE: 'free', PREMIUM: 'premium' };

// ── Gemini model ──────────────────────────────────────────────────────────────
export const GEMINI_MODEL = 'gemini-2.0-flash';

// ── Murf AI voice IDs ─────────────────────────────────────────────────────────
export const MURF_API_URL = 'https://api.murf.ai/v1/speech/generate';
