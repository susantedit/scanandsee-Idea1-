import { SCORE_BASE, SCORE_MODIFIERS } from '../config/constants.js';
import { clamp, round } from '../utils/helpers.js';

/**
 * Calculate a composite health score (0–10) from a nutrition analysis object.
 * Uses the algorithm defined in BACKEND_PLAN.md §7.
 *
 * @param {object} analysis - validated AnalysisSchema object
 * @returns {number} score 0.0–10.0 (one decimal place)
 */
export function calculateHealthScore(analysis) {
  let score = SCORE_BASE;
  const m = SCORE_MODIFIERS;

  const {
    protein_g   = 0,
    fiber_g     = 0,
    sugar_g     = 0,
    sodium_mg   = 0,
    fats_g      = 0,
    ingredients = [],
    warnings    = [],
  } = analysis;

  // ── Positive modifiers ────────────────────────────────────────────────────
  if (protein_g > 20)  score += m.HIGH_PROTEIN;
  if (fiber_g  > 5)    score += m.GOOD_FIBER;
  if (sugar_g  < 5)    score += m.LOW_SUGAR;
  if (sodium_mg < 400) score += m.LOW_SODIUM;

  const hasDangerous = ingredients.some(i => i.safety === 'dangerous');
  if (!hasDangerous)   score += m.NO_DANGEROUS_ADDITIVE;

  // Whole food heuristic: no dangerous ingredients + short ingredient list
  if (!hasDangerous && ingredients.length <= 5) score += m.WHOLE_FOOD;

  // ── Negative modifiers ────────────────────────────────────────────────────
  if (hasDangerous)    score += m.DANGEROUS_ADDITIVE; // negative value

  if (sugar_g  > 15)   score += m.HIGH_SUGAR;
  if (sodium_mg > 800) score += m.HIGH_SODIUM;
  if (protein_g < 3)   score += m.VERY_LOW_PROTEIN;

  // Trans fats: check ingredients for "trans fat", "partially hydrogenated"
  const hasTransFat = ingredients.some(i =>
    /trans fat|partially hydrogenated/i.test(i.name)
  );
  if (hasTransFat) score += m.TRANS_FATS;

  // Ultra-processed: many dangerous/moderate ingredients
  const badCount = ingredients.filter(i => i.safety !== 'safe').length;
  if (badCount >= 3) score += m.ULTRA_PROCESSED;

  // Multiple warnings
  if (warnings.length >= 3) score += m.MULTIPLE_WARNINGS;

  return round(clamp(score, 0, 10), 1);
}

/**
 * Determine verdict from score.
 * @param {number} score
 * @returns {'HEALTHY'|'MODERATE'|'UNHEALTHY'}
 */
export function scoreToVerdict(score) {
  if (score >= 7) return 'HEALTHY';
  if (score >= 4) return 'MODERATE';
  return 'UNHEALTHY';
}

/**
 * Calculate a daily nutrition score from a daily log entry.
 * @param {object} dailyLog - { totalCalories, totalProtein, totalSugar, totalSodium, scansCount }
 * @returns {number} 0–10
 */
export function calculateDailyScore(dailyLog) {
  const { totalCalories = 0, totalProtein = 0, totalSugar = 0, totalSodium = 0 } = dailyLog;

  let score = SCORE_BASE;

  // Good protein intake (>50g/day)
  if (totalProtein > 50) score += 1.0;
  else if (totalProtein < 20) score -= 0.5;

  // Reasonable calories (1200–2500)
  if (totalCalories >= 1200 && totalCalories <= 2500) score += 0.5;
  else if (totalCalories > 3000) score -= 0.5;

  // Low daily sugar (<50g)
  if (totalSugar < 50) score += 0.5;
  else if (totalSugar > 100) score -= 1.0;

  // Low daily sodium (<2300mg)
  if (totalSodium < 2300) score += 0.5;
  else if (totalSodium > 3500) score -= 0.5;

  return round(clamp(score, 0, 10), 1);
}
