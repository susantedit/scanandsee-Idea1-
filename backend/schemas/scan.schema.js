import { z } from 'zod';

export const IngredientSchema = z.object({
  name:        z.string().min(1).max(200).trim(),
  safety:      z.enum(['safe', 'moderate', 'dangerous']),
  side_effect: z.string().max(500).trim().default(''),
  alternative: z.string().max(500).trim().default(''),
});

export const WarningSchema = z.object({
  text:      z.string().min(1).max(500).trim(),
  risk_type: z.enum([
    'diabetes', 'heart', 'obesity', 'cancer', 'allergy',
    'toxicity', 'drug_interaction', 'fake_product', 'expiry', 'general',
  ]),
});

export const GymAssessmentSchema = z.object({
  good_for_bulking:      z.boolean(),
  good_for_cutting:      z.boolean(),
  pre_workout:           z.boolean(),
  post_workout:          z.boolean(),
  protein_quality_score: z.number().min(0).max(10),
  muscle_recovery_score: z.number().min(0).max(10),
  gym_notes:             z.string().max(300).trim().default(''),
});

export const AnalysisSchema = z.object({
  // Universal detection fields
  object_type: z.enum([
    'food', 'packaged_food', 'supplement', 'medicine',
    'plant', 'animal', 'document', 'product', 'scene', 'person', 'other',
  ]).default('food'),
  confidence:  z.number().min(0).max(100).default(80),
  description: z.string().max(1000).trim().default(''),
  fun_facts:   z.array(z.string().max(300).trim()).max(5).default([]),

  // Core fields
  food_name:         z.string().min(1).max(200).trim(),
  health_score:      z.number().min(0).max(10),
  verdict:           z.enum([
    'HEALTHY', 'MODERATE', 'UNHEALTHY',
    'SAFE', 'CAUTION', 'DANGEROUS', 'IDENTIFIED', 'UNKNOWN',
  ]),

  // Nutrition (0 for non-food)
  calories:          z.number().nonnegative().max(10000).default(0),
  protein_g:         z.number().nonnegative().max(1000).default(0),
  carbs_g:           z.number().nonnegative().max(1000).default(0),
  fats_g:            z.number().nonnegative().max(1000).default(0),
  sugar_g:           z.number().nonnegative().max(1000).default(0),
  sodium_mg:         z.number().nonnegative().max(100000).default(0),
  fiber_g:           z.number().nonnegative().max(1000).default(0),
  serving_size:      z.string().max(100).trim().optional().default('1 serving'),

  // Analysis
  ingredients:       z.array(IngredientSchema).max(100).default([]),
  warnings:          z.array(WarningSchema).max(20).default([]),
  improvements:      z.array(z.string().max(300).trim()).max(10).default([]),
  gym_assessment:    GymAssessmentSchema.optional(),
  voice_explanation: z.string().min(1).max(1000).trim(),
});

// History query params
export const HistoryQuerySchema = z.object({
  limit:  z.coerce.number().int().min(1).max(50).default(20),
  offset: z.coerce.number().int().min(0).max(10000).default(0),
});
