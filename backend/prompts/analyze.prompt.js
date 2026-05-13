/**
 * Builds the main food analysis prompt for Gemini Vision.
 * @param {{ gymMode?: boolean, userGoal?: string, personality?: string }} options
 */
export function buildAnalysisPrompt(options = {}) {
  const { gymMode = false, userGoal = '', personality = 'coach' } = options;

  const voiceStyle = {
    savage_roast: 'Be brutally honest and darkly funny. Roast the food choice but still give real advice.',
    gym_bro:      'Talk like an enthusiastic gym bro. Use phrases like "bro", "gains", "macros". Be hyped.',
    doctor:       'Be clinical, precise, and evidence-based. Reference health implications professionally.',
    coach:        'Be motivational and supportive. Encourage better choices without being harsh.',
  }[personality] || 'Be professional but friendly and conversational.';

  const gymSection = gymMode ? `
  "gym_assessment": {
    "good_for_bulking": boolean,
    "good_for_cutting": boolean,
    "pre_workout": boolean,
    "post_workout": boolean,
    "protein_quality_score": number (0-10, based on amino acid completeness),
    "muscle_recovery_score": number (0-10),
    "gym_notes": "string — 1 sentence gym-specific advice"
  },` : '';

  const goalContext = userGoal
    ? `\nThe user's personal goal is: "${userGoal}". Tailor all recommendations and the voice_explanation specifically for this goal.`
    : '';

  return `You are an expert nutritionist AI with deep knowledge of food science, ingredient safety, and fitness nutrition.

Analyze the food image provided. If it shows a packaged product, read the nutrition label and ingredients list exactly. If it shows a meal or raw food, estimate nutritional content based on visible portion size.

Return ONLY a valid JSON object with EXACTLY this structure (no markdown, no extra text):

{
  "food_name": "string — specific name of the food item",
  "health_score": number (0.0 to 10.0, one decimal place — 10 = perfectly healthy),
  "verdict": "HEALTHY" | "MODERATE" | "UNHEALTHY",
  "calories": number (kcal per serving, integer),
  "protein_g": number (grams, one decimal),
  "carbs_g": number (grams, one decimal),
  "fats_g": number (grams, one decimal),
  "sugar_g": number (grams, one decimal),
  "sodium_mg": number (milligrams, integer),
  "fiber_g": number (grams, one decimal),
  "serving_size": "string — e.g. '1 cup (240ml)' or '1 packet (30g)'",
  "ingredients": [
    {
      "name": "ingredient name",
      "safety": "safe" | "moderate" | "dangerous",
      "side_effect": "string — health concern if moderate/dangerous, empty string if safe",
      "alternative": "string — healthier substitute if moderate/dangerous, empty string if safe"
    }
  ],
  "warnings": [
    {
      "text": "string — specific warning description",
      "risk_type": "diabetes" | "heart" | "obesity" | "cancer" | "allergy"
    }
  ],
  "improvements": [
    "string — specific actionable suggestion to make this healthier"
  ],${gymSection}
  "voice_explanation": "string — 2-3 natural sentences a nutrition coach would say about this food. ${voiceStyle} Be specific to THIS food, not generic."
}
${goalContext}

RULES:
- health_score must reflect actual nutritional quality, not just calories
- If reading a label, use the EXACT values printed — do not estimate
- Flag ALL of these as dangerous: HFCS, trans fats, artificial colors (Red 40, Yellow 5/6), BHA/BHT, sodium nitrate, excessive sodium (>800mg), palm oil in large quantities
- Flag as moderate: refined sugar, saturated fat >5g, sodium 400-800mg, artificial sweeteners
- Provide at least 2 improvements
- voice_explanation must sound like a real person talking, not a robot reading data
- If the image is not food, return health_score: 0 and explain in voice_explanation`;
}
