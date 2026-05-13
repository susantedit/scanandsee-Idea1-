/**
 * Builds the grocery cart analysis prompt.
 * @param {Array} products - array of analyzed product objects
 * @param {string} goal
 */
export function buildGroceryPrompt(products, goal = 'healthy_eating') {
  const productSummary = products.map((p, i) => ({
    item:         i + 1,
    name:         p.food_name || p.name,
    health_score: p.health_score,
    calories:     p.calories,
    protein_g:    p.protein_g,
    sugar_g:      p.sugar_g,
    verdict:      p.verdict,
    warnings:     (p.warnings || []).map(w => w.text),
  }));

  return `You are a grocery nutrition expert. Analyze this shopping cart and give comprehensive feedback.

Cart contents (${products.length} items):
${JSON.stringify(productSummary, null, 2)}

User goal: ${goal}

Return ONLY valid JSON:
{
  "cart_score": number (0-10),
  "cart_verdict": "HEALTHY CART" | "MIXED CART" | "UNHEALTHY CART",
  "total_estimated_calories_per_day": number,
  "nutrition_balance": {
    "protein": "string — 'Adequate' | 'Low' | 'High'",
    "carbs":   "string — 'Balanced' | 'Too High' | 'Too Low'",
    "fats":    "string — 'Healthy' | 'Too Much Saturated' | 'Low'",
    "sugar":   "string — 'Controlled' | 'High' | 'Very High'",
    "fiber":   "string — 'Good' | 'Low'"
  },
  "best_items": [
    { "name": "string", "reason": "string — why it's great" }
  ],
  "worst_items": [
    { "name": "string", "issue": "string — specific problem", "swap": "string — healthier alternative" }
  ],
  "missing_nutrients": ["string — nutrients not covered by this cart"],
  "add_to_cart": [
    { "item": "string", "reason": "string — what it adds nutritionally", "budget_friendly": boolean }
  ],
  "remove_or_reduce": [
    { "item": "string", "reason": "string", "alternative": "string" }
  ],
  "goal_alignment": "string — how well this cart matches the user's goal",
  "money_wasted_on": ["string — overpriced or low-value items"],
  "summary": "string — 2-3 sentences overall cart assessment"
}`;
}
