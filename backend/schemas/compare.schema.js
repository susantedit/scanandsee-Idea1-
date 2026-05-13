import { z } from 'zod';

export const ComparisonDetailSchema = z.object({
  metric:  z.string(),
  a_value: z.string(),
  b_value: z.string(),
  winner:  z.enum(['A', 'B', 'TIE']),
  note:    z.string().default(''),
});

export const ComparisonProductSchema = z.object({
  name:                   z.string(),
  health_score:           z.number().min(0).max(10),
  calories:               z.number().nonnegative(),
  protein_g:              z.number().nonnegative(),
  carbs_g:                z.number().nonnegative(),
  fats_g:                 z.number().nonnegative(),
  sugar_g:                z.number().nonnegative(),
  sodium_mg:              z.number().nonnegative(),
  dangerous_ingredients:  z.array(z.string()).default([]),
});

export const ComparisonResultSchema = z.object({
  product_a:          ComparisonProductSchema,
  product_b:          ComparisonProductSchema,
  winner:             z.enum(['A', 'B', 'TIE']),
  reason:             z.string(),
  comparison_details: z.array(ComparisonDetailSchema),
});
