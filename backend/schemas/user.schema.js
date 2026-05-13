import { z } from 'zod';
import { USER_GOALS, ACTIVITY_LEVELS } from '../config/constants.js';

export const ProfileSchema = z.object({
  // Trim and limit all string fields
  name:          z.string().min(1).max(100).trim().optional(),
  age:           z.number().int().min(10).max(120).nullable().optional(),
  weight:        z.number().min(20).max(500).nullable().optional(),
  weightUnit:    z.enum(['kg', 'lbs']).default('kg'),
  activityLevel: z.enum(ACTIVITY_LEVELS).default('moderate'),
  goal:          z.enum(USER_GOALS).default('healthy_eating'),
  aiPersona:     z.enum(['doctor', 'gym_bro', 'coach', 'savage_roast']).default('coach'),
  // tier is NEVER accepted from client — set server-side only via Firebase custom claims
  // Explicitly strip it if somehow included
}).strip(); // strip unknown fields
