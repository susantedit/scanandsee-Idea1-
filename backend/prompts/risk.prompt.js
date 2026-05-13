/**
 * Builds the health risk prediction prompt from weekly eating patterns.
 * @param {Array} weeklyLogs - array of daily log objects
 */
export function buildRiskPrompt(weeklyLogs) {
  const summary = weeklyLogs.map(d => ({
    date:     d.date,
    calories: Math.round(d.totalCalories || 0),
    protein:  Math.round(d.totalProtein  || 0),
    sugar:    Math.round(d.totalSugar    || 0),
    sodium:   Math.round(d.totalSodium   || 0),
    scans:    d.scansCount || 0,
    score:    d.nutritionScore || 5,
  }));

  return `You are a preventive health AI. Analyze this person's 7-day eating pattern and predict health risks.

Weekly eating data:
${JSON.stringify(summary, null, 2)}

Return ONLY valid JSON:
{
  "overall_diet_score": number (0-10),
  "diet_pattern": "string — e.g. 'High Sugar, Low Protein' or 'Balanced'",
  "risks": [
    {
      "condition": "string — e.g. 'Type 2 Diabetes', 'Hypertension', 'Protein Deficiency'",
      "risk_level": "LOW" | "MODERATE" | "HIGH",
      "risk_score": number (0-100, percentage likelihood if pattern continues),
      "contributing_factors": ["string — specific dietary factors causing this risk"],
      "timeline": "string — e.g. 'Risk increases over 6-12 months if pattern continues'",
      "prevention": ["string — specific dietary changes to reduce this risk"]
    }
  ],
  "positive_patterns": ["string — good habits detected"],
  "concerning_patterns": ["string — bad habits detected"],
  "weekly_trends": {
    "calories": "string — 'Consistent' | 'Increasing' | 'Decreasing' | 'Irregular'",
    "protein":  "string — 'Adequate' | 'Low' | 'High'",
    "sugar":    "string — 'Controlled' | 'High' | 'Very High'",
    "sodium":   "string — 'Normal' | 'Elevated' | 'High'"
  },
  "top_recommendations": ["string — most impactful changes to make"],
  "summary": "string — 2-3 sentences summarizing the health outlook"
}`;
}
