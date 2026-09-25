import type { Request, Response, NextFunction, RequestHandler } from 'express';
import { ZodError, type ZodSchema } from 'zod';
import { AppError } from '../lib/app-error.js';

type Source = 'body' | 'query' | 'params';

/**
 * Generic Zod validation middleware.
 *
 * Usage:
 *   router.post('/register', validate(RegisterSchema), handler)
 *   router.get('/', validate(ListQuerySchema, 'query'), handler)
 *
 * Validated + coerced output is written back to req[source] so handlers
 * receive fully typed data.
 */
export function validate<T>(schema: ZodSchema<T>, source: Source = 'body'): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      const zodError = result.error as ZodError;
      return next(
        AppError.badRequest('Validation failed', {
          issues: zodError.issues.map((issue) => ({
            path: issue.path.join('.'),
            code: issue.code,
            message: issue.message,
          })),
        }),
      );
    }
    // Write parsed (coerced) data back. Express 5 made `req.query` a
    // getter-only property, so plain assignment throws. We use
    // `Object.defineProperty` to replace the getter with a value prop.
    if (source === 'query') {
      Object.defineProperty(req, 'query', {
        value: result.data,
        writable: true,
        configurable: true,
      });
    } else {
      (req as unknown as Record<Source, unknown>)[source] = result.data;
    }
    next();
  };
}
