/**
 * Format grams value — rounds to 1 decimal, removes trailing .0
 */
export function formatGrams(value) {
  if (value == null) return '—';
  const rounded = Math.round(value * 10) / 10;
  return rounded % 1 === 0 ? `${rounded}g` : `${rounded}g`;
}

/**
 * Format calories — integer
 */
export function formatCalories(value) {
  if (value == null) return '—';
  return `${Math.round(value)} kcal`;
}

/**
 * Format milligrams
 */
export function formatMg(value) {
  if (value == null) return '—';
  return `${Math.round(value)}mg`;
}

/**
 * Format a percentage (0–100)
 */
export function formatPercent(value) {
  if (value == null) return '—';
  return `${Math.round(value)}%`;
}

/**
 * Time ago string from a date.
 */
export function timeAgo(date) {
  if (!date) return '';
  const d = date instanceof Date ? date : new Date(date);
  const seconds = Math.floor((Date.now() - d.getTime()) / 1000);

  if (seconds < 60)   return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400)return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/**
 * Daily reference values (approximate adult averages).
 */
export const DAILY_REF = {
  calories: 2000,
  protein:  50,
  carbs:    275,
  fats:     78,
  sugar:    50,
  sodium:   2300,
  fiber:    28,
};

/**
 * Calculate % of daily reference value.
 */
export function dailyPercent(value, nutrient) {
  const ref = DAILY_REF[nutrient];
  if (!ref || !value) return 0;
  return Math.min(Math.round((value / ref) * 100), 999);
}

/**
 * Persona display names.
 */
export const PERSONA_LABELS = {
  doctor:       'Dr. Nutrition',
  gym_bro:      'Gym Bro',
  coach:        'Coach',
  savage_roast: 'Savage Roast',
};

/**
 * Goal display names.
 */
export const GOAL_LABELS = {
  weight_loss:    'Weight Loss',
  muscle_gain:    'Muscle Gain',
  bulking:        'Bulking',
  cutting:        'Cutting',
  healthy_eating: 'Healthy Eating',
  diabetic:       'Diabetic-Friendly',
  student_budget: 'Student Budget',
};
