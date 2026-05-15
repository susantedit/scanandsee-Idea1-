/**
 * Simple AI memory system — learns from user's scan history
 * and personalizes chat responses.
 */

export class AIMemory {
  constructor(scanHistory = []) {
    this.scanHistory = scanHistory;
    this.habits = this.buildHabits();
  }

  buildHabits() {
    const habits = {
      favoriteFood: null,
      mostCommonVerdict: null,
      avgHealthScore: 0,
      totalScans: this.scanHistory.length,
      foodFrequency: {},
      verdictCounts: {},
    };

    if (this.scanHistory.length === 0) return habits;

    let totalScore = 0;
    this.scanHistory.forEach(scan => {
      const food = scan.food_name?.toLowerCase() || 'unknown';
      habits.foodFrequency[food] = (habits.foodFrequency[food] || 0) + 1;

      const verdict = scan.verdict || 'MODERATE';
      habits.verdictCounts[verdict] = (habits.verdictCounts[verdict] || 0) + 1;

      totalScore += scan.health_score || 0;
    });

    habits.avgHealthScore = Math.round((totalScore / this.scanHistory.length) * 10) / 10;

    const topFood = Object.entries(habits.foodFrequency).sort((a, b) => b[1] - a[1])[0];
    habits.favoriteFood = topFood ? topFood[0] : null;

    const topVerdict = Object.entries(habits.verdictCounts).sort((a, b) => b[1] - a[1])[0];
    habits.mostCommonVerdict = topVerdict ? topVerdict[0] : 'MODERATE';

    return habits;
  }

  /**
   * Generate a personalized prompt prefix for the AI based on user habits.
   * This is appended to the regular chat prompt to inject memory.
   */
  getPersonalizationContext() {
    const { favoriteFood, mostCommonVerdict, totalScans, avgHealthScore } = this.habits;

    if (totalScans === 0) return '';

    let context = `\n\n[User context: `;
    context += `has scanned ${totalScans} foods, `;
    context += `average health score ${avgHealthScore}/10, `;
    if (favoriteFood) context += `favorite food is ${favoriteFood}, `;
    context += `eating pattern: ${mostCommonVerdict.toLowerCase()}. `;
    context += `Use this to personalize advice.]\n`;

    return context;
  }

  /**
   * Generate a personalized greeting based on habits
   */
  getPersonalizedGreeting(persona = 'coach') {
    const { totalScans, avgHealthScore } = this.habits;

    if (totalScans === 0) return null;

    const greetings = {
      coach: [
        `Looking good! You've scanned ${totalScans} meals. Let's keep that momentum.`,
        `${totalScans} scans down, bro. Your avg health score is ${avgHealthScore}. Room to improve!`,
      ],
      doctor: [
        `I see you've been tracking ${totalScans} foods. Your average health score is ${avgHealthScore}. Let's discuss your diet.`,
      ],
      gym_bro: [
        `Yo! ${totalScans} scans, avg health ${avgHealthScore}. Let's optimize your gains!`,
      ],
    };

    const msgs = greetings[persona] || greetings.coach;
    return msgs[Math.floor(Math.random() * msgs.length)];
  }

  /**
   * Check if user has repeating patterns (warning system)
   */
  getWarnings() {
    const warnings = [];
    const { verdictCounts } = this.habits;

    const indulgentCount = verdictCounts['INDULGENT'] || 0;
    const totalCount = this.scanHistory.length;

    if (indulgentCount / totalCount > 0.5 && totalCount > 5) {
      warnings.push('You are eating indulgent foods more than 50% of the time.');
    }

    // High sugar pattern
    const highSugarScans = this.scanHistory.filter(s => (s.sugar_g || 0) > 20).length;
    if (highSugarScans / totalCount > 0.4 && totalCount > 5) {
      warnings.push('Your sugar intake has been consistently high.');
    }

    return warnings;
  }
}

/**
 * Hook-like usage: get AI memory from scan history
 */
export function createAIMemory(scanHistory) {
  return new AIMemory(scanHistory);
}
