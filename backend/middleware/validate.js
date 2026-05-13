import { badRequest } from '../utils/apiError.js';

/**
 * Zod schema validation middleware factory.
 * Validates req.body against the provided Zod schema.
 * Replaces req.body with the parsed + coerced + stripped data
 * (unknown fields are dropped by Zod's .strict() or default strip behavior).
 *
 * @param {import('zod').ZodSchema} schema
 * @returns Express middleware
 */
export function validate(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      const issues = result.error.issues.map((i) => ({
        field:   i.path.join('.'),
        message: i.message,
      }));
      return next(badRequest('Validation failed', { issues }));
    }

    // Replace with parsed data — strips unknown fields, coerces types
    req.body = result.data;
    next();
  };
}

/**
 * Validate query params against a Zod schema.
 */
export function validateQuery(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.query);

    if (!result.success) {
      const issues = result.error.issues.map((i) => ({
        field:   i.path.join('.'),
        message: i.message,
      }));
      return next(badRequest('Invalid query parameters', { issues }));
    }

    req.query = result.data;
    next();
  };
}

/**
 * Validate route params against a Zod schema.
 */
export function validateParams(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.params);

    if (!result.success) {
      return next(badRequest('Invalid URL parameters'));
    }

    req.params = result.data;
    next();
  };
}
