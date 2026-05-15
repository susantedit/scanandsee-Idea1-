/**
 * Generate semantic badges from scan analysis results.
 * Examples: "Protein High", "Sugar Warning", "Good for Bulking"
 */
export function generateBadges(analysis, gymMode = false) {
  const badges = [];

  if (!analysis) return badges;

  const { protein_g, carbs_g, sugar_g, health_score, verdict } = analysis;

  // Protein badges
  if (protein_g >= 20) badges.push({ label: 'HIGH PROTEIN', color: 'var(--primary)' });
  if (protein_g >= 30) badges.push({ label: 'PROTEIN PACKED', color: 'var(--primary-bright)' });

  // Sugar warnings
  if (sugar_g >= 15) badges.push({ label: 'SUGAR WARNING', color: 'var(--warning)' });
  if (sugar_g >= 30) badges.push({ label: 'SUGAR HIGH', color: 'var(--error)' });

  // Carbs
  if (carbs_g >= 40) badges.push({ label: 'HIGH CARBS', color: 'var(--secondary)' });
  if (carbs_g >= 60 && gymMode) badges.push({ label: 'CARB LOADING', color: 'var(--secondary-bright)' });

  // Verdict-based
  if (verdict === 'HEALTHY') {
    badges.push({ label: '✓ CLEAN', color: 'var(--primary)' });
  } else if (verdict === 'MODERATE') {
    badges.push({ label: '⚠ MODERATE', color: 'var(--warning)' });
  } else if (verdict === 'INDULGENT') {
    badges.push({ label: 'TREAT', color: 'var(--tertiary)' });
  }

  // Gym mode badges
  if (gymMode) {
    if (protein_g >= 15 && carbs_g >= 30) {
      badges.push({ label: 'BULKING FRIENDLY', color: 'var(--primary)' });
    }
    if (health_score >= 7 && protein_g >= 10) {
      badges.push({ label: 'GOOD FOR GAINS', color: 'var(--primary-bright)' });
    }
  }

  // Health score
  if (health_score >= 8) {
    badges.push({ label: '⭐ EXCELLENT', color: 'var(--primary)' });
  }

  return badges.slice(0, 3); // limit to 3 badges
}
