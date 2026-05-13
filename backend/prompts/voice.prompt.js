/**
 * Builds a voice explanation prompt for a given analysis result.
 * Used when we need to regenerate or customize the voice explanation.
 * @param {object} analysis - scan analysis result
 * @param {string} persona - AI personality
 */
export function buildVoicePrompt(analysis, persona = 'coach') {
  const styles = {
    doctor:       'Speak as a professional nutritionist giving a clinical assessment.',
    gym_bro:      'Speak like an enthusiastic gym bro. Use "bro", "gains", "macros". Be hyped about protein.',
    coach:        'Speak as a motivational nutrition coach. Be encouraging and specific.',
    savage_roast: 'Roast the food choice with dark humor but include real nutritional facts.',
  };

  const style = styles[persona] || styles.coach;

  return `${style}

Generate a natural, spoken voice explanation for this food analysis. 
Write it as if you are SPEAKING to the user, not writing a report.
Keep it to 2-3 sentences maximum. Be specific to the actual numbers.

Food: ${analysis.food_name}
Health Score: ${analysis.health_score}/10
Verdict: ${analysis.verdict}
Calories: ${analysis.calories} kcal
Protein: ${analysis.protein_g}g
Sugar: ${analysis.sugar_g}g
Sodium: ${analysis.sodium_mg}mg
Key warnings: ${analysis.warnings?.map(w => w.text).join('; ') || 'none'}

Return ONLY a JSON object:
{
  "text": "string — the voice explanation text to be spoken aloud"
}`;
}
