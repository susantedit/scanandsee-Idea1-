/**
 * AI Memory — local preference model
 *
 * Stores user eating patterns, preferences, and habits in localStorage.
 * Used to personalize AI chat responses and scan recommendations.
 * No server needed — fully client-side, privacy-respecting.
 */

const KEY = 'scanandsee_memory';
const MAX_FOODS = 50;
const MAX_WARNINGS = 20;

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : getDefault();
  } catch {
    return getDefault();
  }
}

function save(data) {
  try { localStorage.setItem(KEY, JSON.stringify(data)); } catch {}
}

function getDefault() {
  return {
    scannedFoods:    [],   // [{ name, score, verdict, date, calories, protein }]
    warningsSeen:    [],   // [{ type, food, date }]
    goalHistory:     [],   // [{ goal, setAt }]
    personaHistory:  [],   // [{ persona, setAt }]
    streakData:      { current: 0, best: 0, lastScanDate: null },
    preferences:     {
      avoidIngredients: [],   // e.g. ['HFCS', 'palm oil']
      favoriteCategories: [], // e.g. ['protein', 'whole food']
      allergies: [],
    },
    stats: {
      totalScans:       0,
      avgHealthScore:   0,
      highSugarDays:    0,
      lowProteinDays:   0,
      gymModeScans:     0,
    },
    lastUpdated: null,
  };
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Record a completed scan into memory.
 */
export function recordScan(scanResult, gymMode = false) {
  const mem = load();

  // Add to scanned foods (keep last MAX_FOODS)
  mem.scannedFoods.unshift({
    name:     scanResult.food_name || scanResult.foodName || 'Unknown',
    score:    scanResult.health_score ?? scanResult.healthScore ?? 5,
    verdict:  scanResult.verdict || 'MODERATE',
    calories: scanResult.calories || 0,
    protein:  scanResult.protein_g ?? scanResult.protein ?? 0,
    sugar:    scanResult.sugar_g ?? scanResult.sugar ?? 0,
    date:     new Date().toISOString(),
  });
  if (mem.scannedFoods.length > MAX_FOODS) mem.scannedFoods = mem.scannedFoods.slice(0, MAX_FOODS);

  // Record warnings seen
  (scanResult.warnings || []).forEach(w => {
    mem.warningsSeen.unshift({ type: w.risk_type, food: scanResult.food_name, date: new Date().toISOString() });
  });
  if (mem.warningsSeen.length > MAX_WARNINGS) mem.warningsSeen = mem.warningsSeen.slice(0, MAX_WARNINGS);

  // Update stats
  mem.stats.totalScans++;
  if (gymMode) mem.stats.gymModeScans++;

  const allScores = mem.scannedFoods.map(f => f.score);
  mem.stats.avgHealthScore = Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length * 10) / 10;

  // Update streak
  const today = new Date().toISOString().split('T')[0];
  const last  = mem.streakData.lastScanDate;
  if (last === today) {
    // same day — no change
  } else if (last === getPrevDay(today)) {
    mem.streakData.current++;
    mem.streakData.best = Math.max(mem.streakData.best, mem.streakData.current);
  } else {
    mem.streakData.current = 1;
  }
  mem.streakData.lastScanDate = today;

  // Auto-detect preferences from dangerous ingredients
  (scanResult.ingredients || []).forEach(ing => {
    if (ing.safety === 'dangerous' && !mem.preferences.avoidIngredients.includes(ing.name)) {
      mem.preferences.avoidIngredients.push(ing.name);
      if (mem.preferences.avoidIngredients.length > 20) mem.preferences.avoidIngredients.shift();
    }
  });

  mem.lastUpdated = new Date().toISOString();
  save(mem);
}

/**
 * Get a personalized context string for AI chat prompts.
 * Injected into chat requests to make AI responses feel personal.
 */
export function getPersonalizedContext() {
  const mem = load();
  if (mem.stats.totalScans === 0) return '';

  const lines = [];

  // Recent eating pattern
  const recent = mem.scannedFoods.slice(0, 5);
  if (recent.length > 0) {
    lines.push(`User's recent scans: ${recent.map(f => `${f.name} (score ${f.score})`).join(', ')}.`);
  }

  // Avg score
  if (mem.stats.avgHealthScore > 0) {
    lines.push(`Average health score: ${mem.stats.avgHealthScore}/10.`);
  }

  // Streak
  if (mem.streakData.current > 1) {
    lines.push(`Current scan streak: ${mem.streakData.current} days.`);
  }

  // Repeated warnings
  const warnCounts = {};
  mem.warningsSeen.forEach(w => { warnCounts[w.type] = (warnCounts[w.type] || 0) + 1; });
  const topWarnings = Object.entries(warnCounts).sort((a, b) => b[1] - a[1]).slice(0, 2);
  if (topWarnings.length > 0) {
    lines.push(`Recurring health concerns: ${topWarnings.map(([t, c]) => `${t} (${c}x)`).join(', ')}.`);
  }

  // Ingredients to avoid
  if (mem.preferences.avoidIngredients.length > 0) {
    lines.push(`Ingredients flagged as dangerous in their food: ${mem.preferences.avoidIngredients.slice(0, 5).join(', ')}.`);
  }

  return lines.length > 0 ? `\n\nUSER MEMORY CONTEXT:\n${lines.join('\n')}` : '';
}

/**
 * Get memory summary for display in UI.
 */
export function getMemorySummary() {
  return load();
}

/**
 * Get smart insight messages based on memory patterns.
 * Returns array of insight strings to show in the app.
 */
export function getInsights() {
  const mem = load();
  const insights = [];

  if (mem.stats.totalScans === 0) return insights;

  // Sugar pattern
  const sugarFoods = mem.scannedFoods.filter(f => f.sugar > 15);
  if (sugarFoods.length >= 3) {
    insights.push(`You've scanned ${sugarFoods.length} high-sugar foods recently. Watch your intake.`);
  }

  // Low protein pattern
  const lowProtein = mem.scannedFoods.filter(f => f.protein < 5);
  if (lowProtein.length >= 3) {
    insights.push(`${lowProtein.length} of your recent scans were low in protein. Consider adding more protein sources.`);
  }

  // Streak
  if (mem.streakData.current >= 3) {
    insights.push(`${mem.streakData.current}-day scan streak! Keep it up.`);
  }

  // Avg score
  if (mem.stats.avgHealthScore < 5) {
    insights.push(`Your average health score is ${mem.stats.avgHealthScore}/10. Small swaps can make a big difference.`);
  } else if (mem.stats.avgHealthScore >= 7) {
    insights.push(`Great eating habits! Your average score is ${mem.stats.avgHealthScore}/10.`);
  }

  // Repeated bad food
  const foodCounts = {};
  mem.scannedFoods.forEach(f => {
    if (f.verdict === 'UNHEALTHY') foodCounts[f.name] = (foodCounts[f.name] || 0) + 1;
  });
  const repeated = Object.entries(foodCounts).find(([, c]) => c >= 3);
  if (repeated) {
    insights.push(`You've scanned "${repeated[0]}" ${repeated[1]} times — it's consistently unhealthy.`);
  }

  return insights.slice(0, 3);
}

/**
 * Clear all memory (for logout or reset).
 */
export function clearMemory() {
  try { localStorage.removeItem(KEY); } catch {}
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function getPrevDay(dateStr) {
  const d = new Date(dateStr);
  d.setDate(d.getDate() - 1);
  return d.toISOString().split('T')[0];
}
