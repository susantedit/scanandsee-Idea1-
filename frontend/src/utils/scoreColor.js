/**
 * Map a health score (0–10) to color, label, and glow CSS values.
 */
export function scoreToColor(score) {
  if (score >= 7) return {
    color:   '#00e639',
    colorDim:'rgba(0,230,57,0.15)',
    glow:    '0 0 14px rgba(0,255,65,0.55)',
    label:   'HEALTHY',
    hex:     '#00e639',
  };
  if (score >= 4) return {
    color:   '#ffd166',
    colorDim:'rgba(255,209,102,0.15)',
    glow:    '0 0 14px rgba(255,209,102,0.55)',
    label:   'MODERATE',
    hex:     '#ffd166',
  };
  return {
    color:   '#ffb4ab',
    colorDim:'rgba(255,180,171,0.15)',
    glow:    '0 0 14px rgba(255,180,171,0.55)',
    label:   'UNHEALTHY',
    hex:     '#ffb4ab',
  };
}

/**
 * Map a safety level to color.
 */
export function safetyToColor(safety) {
  switch (safety) {
    case 'safe':      return '#00e639';
    case 'moderate':  return '#ffd166';
    case 'dangerous': return '#ffb4ab';
    default:          return '#b9ccb2';
  }
}

/**
 * Map a risk type to a chip variant class.
 */
export function riskToChip(riskType) {
  switch (riskType) {
    case 'diabetes': return 'chip-moderate';
    case 'heart':    return 'chip-danger';
    case 'obesity':  return 'chip-moderate';
    case 'cancer':   return 'chip-danger';
    case 'allergy':  return 'chip-danger';
    default:         return 'chip-default';
  }
}
