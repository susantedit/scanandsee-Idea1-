import { z } from 'zod';

export const IngredientSchema = z.object({
  name:        z.string().min(1).max(200).trim(),
  safety:      z.enum(['safe', 'moderate', 'dangerous']),
  side_effect: z.string().max(500).trim().default(''),
  alternative: z.string().max(500).trim().default(''),
});

export const WarningSchema = z.object({
  text:      z.string().min(1).max(500).trim(),
  risk_type: z.enum(['diabetes', 'heart', 'obesity', 'cancer', 'allergy']),
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
  food_name:         z.string().min(1).max(200).trim(),
  health_score:      z.number().min(0).max(10),
  verdict:           z.enum(['HEALTHY', 'MODERATE', 'UNHEALTHY']),
  calories:          z.number().nonnegative().max(10000),
  protein_g:         z.number().nonnegative().max(1000),
  carbs_g:           z.number().nonnegative().max(1000),
  fats_g:            z.number().nonnegative().max(1000),
  sugar_g:           z.number().nonnegative().max(1000),
  sodium_mg:         z.number().nonnegative().max(100000),
  fiber_g:           z.number().nonnegative().max(1000),
  serving_size:      z.string().max(100).trim().optional().default('1 serving'),
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
