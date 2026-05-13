/**
 * Builds the mood & brain analysis prompt.
 * @param {object} nutrition - { calories, protein_g, carbs_g, fats_g, sugar_g, sodium_mg, food_name }
 * @param {string} persona
 */
export function buildMoodPrompt(nutrition, persona = 'coach') {
  const style = {
    doctor:       'Be clinical and evidence-based.',
    gym_bro:      'Be energetic and gym-focused.',
    coach:        'Be supportive and practical.',
    savage_roast: 'Be brutally honest with dark humor.',
  }[persona] || 'Be helpful and clear.';

  return `You are a neuroscience and nutrition expert. Analyze how this food affects the brain and mood.

Food: ${nutrition.food_name}
Calories: ${nutrition.calories} kcal
Protein: ${nutrition.protein_g}g | Carbs: ${nutrition.carbs_g}g | Fats: ${nutrition.fats_g}g
Sugar: ${nutrition.sugar_g}g | Sodium: ${nutrition.sodium_mg}mg

Return ONLY valid JSON:
{
  "energy_level": {
    "score": number (1-10, 10 = sustained high energy),
    "label": "string — e.g. 'High Energy Spike' or 'Steady Focus'",
    "description": "string — 1 sentence explanation"
  },
  "energy_crash_risk": {
    "score": number (1-10, 10 = very likely to crash),
    "label": "string — e.g. 'Low Risk' or 'High Crash Risk'",
    "time_to_crash": "string — e.g. '30-60 minutes' or 'No crash expected'",
    "description": "string — 1 sentence"
  },
  "focus_impact": {
    "score": number (1-10, 10 = excellent focus),
    "label": "string",
    "description": "string — 1 sentence"
  },
  "sleep_impact": {
    "score": number (1-10, 10 = great for sleep),
    "label": "string — e.g. 'Sleep Friendly' or 'May Disrupt Sleep'",
    "description": "string — 1 sentence"
  },
  "mood_effect": {
    "score": number (1-10, 10 = great mood boost),
    "label": "string — e.g. 'Mood Booster' or 'Mood Neutral'",
    "description": "string — 1 sentence"
  },
  "brain_nutrients": ["string — list of brain-beneficial nutrients found, e.g. 'Omega-3', 'B12'"],
  "best_time_to_eat": "string — e.g. 'Morning for energy', 'Pre-workout', 'Avoid at night'",
  "summary": "string — 2 sentences. ${style}"
}`;
}
