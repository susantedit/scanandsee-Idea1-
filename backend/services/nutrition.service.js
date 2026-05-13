import { cacheService } from './cache.service.js';
import { CACHE_TTL_USDA, CACHE_TTL_BARCODE } from '../config/constants.js';
import logger from '../utils/logger.js';

const USDA_BASE = 'https://api.nal.usda.gov/fdc/v1';
const OFF_BASE  = 'https://world.openfoodfacts.org/api/v0';

/**
 * Search USDA FoodData Central for a food item.
 * @param {string} query
 * @returns {Promise<Array>} array of food matches
 */
export async function searchUSDA(query) {
  const cacheKey = `usda:${query.toLowerCase().trim()}`;

  return cacheService.getOrSet(cacheKey, async () => {
    const apiKey = process.env.USDA_API_KEY;
    if (!apiKey) {
      logger.warn('USDA_API_KEY not set — skipping USDA search');
      return [];
    }

    const url = `${USDA_BASE}/foods/search?query=${encodeURIComponent(query)}&api_key=${apiKey}&pageSize=5&dataType=Foundation,SR%20Legacy`;

    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`USDA API error: ${res.status}`);
      const data = await res.json();

      return (data.foods || []).map(food => ({
        fdcId:    food.fdcId,
        name:     food.description,
        brand:    food.brandOwner || null,
        calories: getNutrient(food.foodNutrients, 'Energy') || 0,
        protein:  getNutrient(food.foodNutrients, 'Protein') || 0,
        carbs:    getNutrient(food.foodNutrients, 'Carbohydrate, by difference') || 0,
        fats:     getNutrient(food.foodNutrients, 'Total lipid (fat)') || 0,
        fiber:    getNutrient(food.foodNutrients, 'Fiber, total dietary') || 0,
        sugar:    getNutrient(food.foodNutrients, 'Sugars, total including NLEA') || 0,
        sodium:   getNutrient(food.foodNutrients, 'Sodium, Na') || 0,
      }));
    } catch (err) {
      logger.error('USDA search failed', { error: err.message, query });
      return [];
    }
  }, CACHE_TTL_USDA);
}

/**
 * Look up a product by barcode using Open Food Facts.
 * @param {string} barcode - EAN/UPC barcode string
 * @returns {Promise<object|null>} product info or null if not found
 */
export async function lookupBarcode(barcode) {
  const cacheKey = `barcode:${barcode}`;

  return cacheService.getOrSet(cacheKey, async () => {
    try {
      const url = `${OFF_BASE}/product/${barcode}.json`;
      const res = await fetch(url, {
        headers: { 'User-Agent': 'ScanAndSee/1.0 (contact@scanandsee.app)' },
      });

      if (!res.ok) return null;
      const data = await res.json();

      if (data.status !== 1 || !data.product) return null;

      const p = data.product;
      const n = p.nutriments || {};

      return {
        barcode,
        name:        p.product_name || p.product_name_en || 'Unknown Product',
        brand:       p.brands || null,
        imageUrl:    p.image_url || null,
        servingSize: p.serving_size || null,
        calories:    n['energy-kcal_100g'] || n['energy-kcal_serving'] || 0,
        protein:     n.proteins_100g || 0,
        carbs:       n.carbohydrates_100g || 0,
        fats:        n.fat_100g || 0,
        sugar:       n.sugars_100g || 0,
        sodium:      (n.sodium_100g || 0) * 1000, // convert g to mg
        fiber:       n.fiber_100g || 0,
        ingredients: p.ingredients_text || null,
        nutriscore:  p.nutriscore_grade || null,
        novaGroup:   p.nova_group || null,
      };
    } catch (err) {
      logger.error('Open Food Facts lookup failed', { error: err.message, barcode });
      return null;
    }
  }, CACHE_TTL_BARCODE);
}

/**
 * Enrich a Gemini analysis result with USDA data for accuracy.
 * If USDA finds a match, we cross-reference the values.
 * @param {object} geminiResult - validated AnalysisSchema object
 * @returns {Promise<object>} enriched result
 */
export async function enrichAnalysis(geminiResult) {
  try {
    const usdaResults = await searchUSDA(geminiResult.food_name);
    if (!usdaResults.length) return geminiResult;

    const best = usdaResults[0];

    // Only override if USDA values seem more reliable (non-zero)
    // We trust Gemini for packaged products (it reads the label)
    // We use USDA to validate whole food estimates
    const enriched = { ...geminiResult };

    // If Gemini's calories are 0 or wildly off, use USDA
    if (geminiResult.calories === 0 && best.calories > 0) {
      enriched.calories = best.calories;
    }

    logger.debug(`Analysis enriched with USDA data for: ${geminiResult.food_name}`);
    return enriched;
  } catch (err) {
    logger.warn('Analysis enrichment failed — using Gemini data only', { error: err.message });
    return geminiResult;
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function getNutrient(nutrients, name) {
  if (!Array.isArray(nutrients)) return null;
  const found = nutrients.find(n => n.nutrientName === name);
  return found ? Math.round(found.value * 10) / 10 : null;
}
