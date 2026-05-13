import { z } from 'zod';

// Scan ID must match our generateId() format — 32 hex chars
const ScanIdSchema = z.string().regex(/^[a-f0-9]{32}$/).optional();

export const ChatRequestSchema = z.object({
  // Trim whitespace, enforce max length to prevent prompt injection via long inputs
  question: z.string().min(1).max(300).trim(),
  scanId:   ScanIdSchema,
});

export const ChatResponseSchema = z.object({
  answer:      z.string(),
  suggestions: z.array(z.string().max(200)).max(5).default([]),
});
