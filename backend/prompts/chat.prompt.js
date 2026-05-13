/**
 * Builds the chat/Q&A prompt for Gemini.
 * @param {string} question - user's question
 * @param {object|null} scanContext - optional scan result for context
 * @param {string} persona - AI personality
 */
export function buildChatPrompt(question, scanContext = null, persona = 'coach') {
  const personaInstructions = {
    doctor:       'Respond as a professional medical nutritionist. Be precise and evidence-based.',
    gym_bro:      'Respond like an enthusiastic gym bro who knows nutrition. Use casual language and gym terms.',
    coach:        'Respond as a supportive nutrition coach. Be encouraging and practical.',
    savage_roast: 'Respond with brutal honesty and dark humor, but still give real nutritional advice.',
  }[persona] || 'Respond as a helpful nutrition expert.';

  const contextSection = scanContext
    ? `
FOOD CONTEXT (the user just scanned this food):
- Food: ${scanContext.foodName}
- Health Score: ${scanContext.healthScore}/10
- Calories: ${scanContext.calories} kcal
- Protein: ${scanContext.protein_g}g | Carbs: ${scanContext.carbs_g}g | Fats: ${scanContext.fats_g}g
- Sugar: ${scanContext.sugar_g}g | Sodium: ${scanContext.sodium_mg}mg
- Verdict: ${scanContext.verdict}
- Warnings: ${scanContext.warnings?.map(w => w.text).join(', ') || 'none'}

Answer the question specifically about this food when relevant.`
    : '';

  return `You are an AI nutrition assistant. ${personaInstructions}
${contextSection}

USER QUESTION: "${question}"

Return ONLY a valid JSON object:
{
  "answer": "string — your full answer (2-4 sentences, conversational)",
  "suggestions": ["string — 3 follow-up questions the user might want to ask next"]
}

Keep the answer focused, practical, and specific. Do not be vague.`;
}
