/**
 * Builds the "Build My Plate" AI prompt.
 * @param {string} goal - user's nutrition goal
 */
export function buildPlatePrompt(goal = 'healthy_eating') {
  const goalMap = {
    weight_loss:    'weight loss — maximize satiety, minimize calories',
    muscle_gain:    'muscle gain — maximize protein, support recovery',
    bulking:        'bulking — maximize calories and protein',
    cutting:        'cutting — high protein, low calorie combination',
    healthy_eating: 'balanced nutrition',
    diabetic:       'diabetic-friendly — low glycemic index combination',
    student_budget: 'maximum nutrition value',
  };

  return `You are a nutrition expert helping someone build an optimal meal from available foods.

The user has scanned 1-3 food items. Analyze them and create the best possible meal combination.
User goal: ${goalMap[goal] || 'balanced nutrition'}

Return ONLY valid JSON:
{
  "meal_name": "string — creative name for this combination",
  "overall_score": number (0-10),
  "total_nutrition": {
    "calories": number,
    "protein_g": number,
    "carbs_g": number,
    "fats_g": number,
    "fiber_g": number
  },
  "combination_verdict": "OPTIMAL" | "GOOD" | "ACCEPTABLE" | "POOR",
  "synergy_benefits": ["string — why these foods work well together"],
  "how_to_combine": "string — specific instructions on how to prepare/combine",
  "portion_guide": [
    {
      "food": "string — food name",
      "recommended_portion": "string — e.g. '150g' or '1 cup'",
      "reason": "string — why this portion"
    }
  ],
  "missing_nutrients": ["string — what this combination lacks"],
  "add_these": [
    {
      "item": "string — ingredient to add",
      "benefit": "string — why it helps",
      "cost": "string — 'Free' | 'Cheap' | 'Moderate'"
    }
  ],
  "avoid_combining_with": ["string — foods that would make this worse"],
  "best_time_to_eat": "string",
  "voice_explanation": "string — 2-3 sentences explaining this meal combination naturally"
}`;
}
