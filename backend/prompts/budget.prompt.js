/**
 * Builds the budget nutrition optimizer prompt.
 * @param {{ budget: number, currency: string, goal: string, days: number }} options
 */
export function buildBudgetPrompt({ budget, currency = 'USD', goal = 'healthy_eating', days = 1 }) {
  const goalMap = {
    weight_loss:    'weight loss — high protein, low calorie, filling foods',
    muscle_gain:    'muscle gain — high protein, calorie surplus',
    bulking:        'bulking — high calorie, high protein, carb-heavy',
    cutting:        'cutting — low calorie, high protein, low fat',
    healthy_eating: 'balanced healthy eating',
    diabetic:       'diabetic-friendly — low sugar, low GI foods',
    student_budget: 'maximum nutrition per dollar — cheap protein sources',
  };

  return `You are a budget nutrition expert. Create an optimized meal plan for the given budget.

Budget: ${currency} ${budget} per ${days === 1 ? 'day' : `${days} days`}
Goal: ${goalMap[goal] || 'balanced healthy eating'}

Return ONLY valid JSON:
{
  "total_budget": number,
  "currency": "${currency}",
  "daily_nutrition_estimate": {
    "calories": number,
    "protein_g": number,
    "carbs_g": number,
    "fats_g": number
  },
  "meals": [
    {
      "meal_type": "Breakfast" | "Lunch" | "Dinner" | "Snack",
      "name": "string — meal name",
      "estimated_cost": number,
      "calories": number,
      "protein_g": number,
      "description": "string — brief description",
      "ingredients": ["string — ingredient with quantity"],
      "prep_time": "string — e.g. '5 minutes'",
      "health_score": number (0-10)
    }
  ],
  "grocery_list": [
    {
      "item": "string — food item",
      "quantity": "string — e.g. '500g' or '1 dozen'",
      "estimated_cost": number,
      "protein_per_cost": "string — e.g. 'High protein per dollar'"
    }
  ],
  "money_saving_tips": ["string — practical tip"],
  "summary": "string — 2 sentences about this budget plan"
}

Include 3-4 meals and 5-8 grocery items. Focus on affordable high-nutrition foods.`;
}
