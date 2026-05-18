import { getAuthToken } from './firebase.js';

const BASE = import.meta.env.VITE_API_URL || '';

// Only warn about HTTPS if deployed to a real domain (not localhost/preview)
const isRealProduction = import.meta.env.PROD && BASE && !BASE.includes('localhost') && !BASE.includes('127.0.0.1');
if (isRealProduction && !BASE.startsWith('https://')) {
  console.error('[Security] VITE_API_URL must use HTTPS in production');
}

class ApiRequestError extends Error {
  constructor(message, status, details = null) {
    super(message);
    this.name    = 'ApiRequestError';
    this.status  = status;
    this.details = details;
  }
}

async function request(method, path, body = null, isFormData = false) {
  let token;
  try { token = await getAuthToken(); } catch {
    throw new ApiRequestError('Session expired. Please sign in again.', 401);
  }

  const headers = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (!isFormData && body) headers['Content-Type'] = 'application/json';

  let res;
  try {
    res = await fetch(`${BASE}${path}`, {
      method,
      headers,
      credentials: 'same-origin',
      body: isFormData ? body : (body ? JSON.stringify(body) : null),
    });
  } catch {
    throw new ApiRequestError('Network error. Check your connection.', 0);
  }

  let data;
  try { data = await res.json(); } catch { data = { error: `Server error (${res.status})` }; }

  // Read Retry-After from headers (if present) and attach to details
  const retryAfter = res.headers?.get?.('Retry-After');
  if (retryAfter) {
    const seconds = Number(retryAfter);
    if (!Number.isNaN(seconds)) {
      data.details = { ...(data.details || {}), retryInSeconds: seconds };
    }
  }

  if (!res.ok) {
    throw new ApiRequestError(data.error || `Request failed (${res.status})`, res.status, data.details);
  }
  return data;
}

// ── Scan ──────────────────────────────────────────────────────────────────────
export async function analyzeScan(imageFile, gymMode = false, userGoal = '', personality = 'coach', context = 'eating') {
  if (!(imageFile instanceof File)) throw new ApiRequestError('Invalid image file', 400);
  if (imageFile.size > 10 * 1024 * 1024) throw new ApiRequestError('Image too large (max 10MB)', 400);
  const form = new FormData();
  form.append('image', imageFile);
  form.append('gymMode', String(gymMode));
  form.append('context', context);
  if (userGoal)    form.append('userGoal',    userGoal.slice(0, 50));
  if (personality) form.append('personality', personality.slice(0, 20));
  return request('POST', '/api/scan/analyze', form, true);
}
export async function getScanHistory(limit = 20, offset = 0) {
  return request('GET', `/api/scan/history?limit=${Math.min(limit,50)}&offset=${Math.max(offset,0)}`);
}
export async function getScan(scanId) {
  if (!/^[a-f0-9]{32}$/.test(scanId)) throw new ApiRequestError('Invalid scan ID', 400);
  return request('GET', `/api/scan/${scanId}`);
}
export async function deleteScan(scanId) {
  if (!/^[a-f0-9]{32}$/.test(scanId)) throw new ApiRequestError('Invalid scan ID', 400);
  return request('DELETE', `/api/scan/${scanId}`);
}

// ── User ──────────────────────────────────────────────────────────────────────
export async function getProfile()              { return request('GET', '/api/user/profile'); }
export async function saveProfile(data)         { return request('POST', '/api/user/profile', data); }
export async function getUserStats()            { return request('GET', '/api/user/stats'); }
export async function getUserInsights()         { return request('GET', '/api/user/insights'); }
export async function getUserWarnings()         { return request('GET', '/api/user/warnings'); }
export async function savePushToken(token)      { return request('POST', '/api/user/push-token', { token }); }

// ── Nutrition ─────────────────────────────────────────────────────────────────
export async function getDailyNutrition()       { return request('GET', '/api/nutrition/daily'); }
export async function getWeeklyNutrition()      { return request('GET', '/api/nutrition/weekly'); }
export async function searchNutrition(query) {
  if (!query) return { results: [] };
  return request('GET', `/api/nutrition/search?query=${encodeURIComponent(query.slice(0, 200))}`);
}

// ── Voice ─────────────────────────────────────────────────────────────────────
export async function generateVoice(text, personality = 'coach', premium = false) {
  if (!text) return null;
  return request('POST', '/api/voice/generate', { text: text.slice(0, 500), personality, premium: Boolean(premium) });
}
export async function getVoicePersonalities()   { return request('GET', '/api/voice/personalities'); }

// ── Compare ───────────────────────────────────────────────────────────────────
export async function compareProducts(imageFileA, imageFileB) {
  const form = new FormData();
  form.append('imageA', imageFileA);
  form.append('imageB', imageFileB);
  return request('POST', '/api/compare/products', form, true);
}

// ── Chat ──────────────────────────────────────────────────────────────────────
export async function askAI(question, scanId = null) {
  const body = { question: question.slice(0, 300) };
  if (scanId && /^[a-f0-9]{32}$/.test(scanId)) body.scanId = scanId;
  return request('POST', '/api/chat/ask', body);
}

// ── Barcode ───────────────────────────────────────────────────────────────────
export async function lookupBarcode(code) {
  if (!/^\d{6,14}$/.test(code)) throw new ApiRequestError('Invalid barcode format', 400);
  return request('GET', `/api/barcode/${code}`);
}

// ── F17: Mood & Brain Analysis ────────────────────────────────────────────────
export async function analyzeMood(nutritionData) {
  return request('POST', '/api/mood/analyze', nutritionData);
}

// ── F18: Health Risk Prediction ───────────────────────────────────────────────
export async function predictHealthRisk() {
  return request('GET', '/api/risk/predict');
}

// ── F19: Budget Nutrition Optimizer ──────────────────────────────────────────
export async function optimizeBudget(budget, currency = 'USD', goal = 'healthy_eating', days = 1) {
  return request('POST', '/api/budget/optimize', { budget, currency, goal, days });
}

// ── F20: Build My Plate ───────────────────────────────────────────────────────
export async function buildPlate(imageFileA, imageFileB = null) {
  const form = new FormData();
  form.append('imageA', imageFileA);
  if (imageFileB instanceof File) form.append('imageB', imageFileB);
  return request('POST', '/api/plate/build', form, true);
}

// ── F21: Supplement Analyzer ──────────────────────────────────────────────────
export async function analyzeSupplement(imageFile) {
  if (!(imageFile instanceof File)) throw new ApiRequestError('Invalid image file', 400);
  const form = new FormData();
  form.append('image', imageFile);
  return request('POST', '/api/supplement/analyze', form, true);
}

// ── F24: Grocery Cart Analysis ────────────────────────────────────────────────
export async function analyzeGroceryCart(imageFiles) {
  if (!imageFiles?.length) throw new ApiRequestError('No images provided', 400);
  const form = new FormData();
  imageFiles.forEach(f => form.append('images', f));
  return request('POST', '/api/grocery/analyze', form, true);
}

// ── Classify (lightweight live-frame preview) ─────────────────────────────────
export async function classifyQuick(imageFile) {
  if (!(imageFile instanceof File)) throw new ApiRequestError('Invalid image file', 400);
  const form = new FormData();
  form.append('image', imageFile);
  return request('POST', '/api/classify/quick', form, true);
}

// ── Tier 3 ────────────────────────────────────────────────────────────────────
export async function getWearableData() { return request('GET', '/api/wearables'); }
export async function saveWearableData(data) { return request('POST', '/api/wearables', data); }
export async function submitEnterpriseInquiry(data) { return request('POST', '/api/enterprise/inquiry', data); }
export async function getMarketplaceProducts() { return request('GET', '/api/marketplace/products'); }

