/**
 * Builds the supplement analyzer prompt.
 */
export function buildSupplementPrompt(persona = 'coach') {
  const style = {
    doctor:       'Be clinical and evidence-based. Cite safety thresholds.',
    gym_bro:      'Talk like a knowledgeable gym bro. Focus on gains and performance.',
    coach:        'Be balanced and practical. Focus on real-world use.',
    savage_roast: 'Be brutally honest about fake claims and marketing BS.',
  }[persona] || 'Be informative and balanced.';

  return `You are a sports nutrition and supplement expert. Analyze this supplement product image.

Return ONLY valid JSON:
{
  "product_name": "string",
  "product_type": "string — e.g. 'Whey Protein', 'Pre-Workout', 'Creatine', 'Multivitamin'",
  "overall_score": number (0-10),
  "verdict": "LEGIT" | "QUESTIONABLE" | "AVOID",
  "claimed_benefits": ["string — what the label claims"],
  "actual_benefits": ["string — what science actually supports"],
  "fake_claims": ["string — marketing claims not supported by evidence"],
  "protein_quality": {
    "score": number (0-10),
    "type": "string — e.g. 'Whey Isolate', 'Concentrate', 'Blend'",
    "amino_profile": "string — 'Complete' | 'Incomplete' | 'Unknown'",
    "notes": "string"
  },
  "dangerous_ingredients": [
    {
      "name": "string",
      "risk": "string — specific health risk",
      "dose_concern": "string — at what dose it becomes dangerous"
    }
  ],
  "hidden_ingredients": ["string — ingredients buried in proprietary blends"],
  "overdose_risks": ["string — what happens if taken in excess"],
  "recommended_dose": "string — evidence-based recommended dose",
  "best_for": ["string — who benefits most from this supplement"],
  "avoid_if": ["string — conditions or situations to avoid this supplement"],
  "value_for_money": "string — 'Excellent' | 'Good' | 'Poor' | 'Overpriced'",
  "alternatives": ["string — better or cheaper alternatives"],
  "voice_explanation": "string — 2-3 sentences. ${style}"
}`;
}
