import type { ErrorRequestHandler, RequestHandler } from 'express';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';
import { AppError } from '../lib/app-error.js';
import { fail } from '../lib/response.js';
import { isDev } from '../config/env.js';

/**
 * 404 handler — must be mounted AFTER all routes.
 */
export const notFoundHandler: RequestHandler = (req, res) => {
  fail(res, {
    statusCode: 404,
    code: 'NOT_FOUND',
    message: `Route ${req.method} ${req.originalUrl} not found`,
  });
};

/**
 * Global error handler — must be the LAST middleware mounted.
 * Express 5 automatically forwards async handler rejections here.
 */
export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  // 1. Our own structured errors
  if (err instanceof AppError) {
    fail(res, {
      statusCode: err.statusCode,
      code: err.code,
      message: err.message,
      details: err.details,
    });
    return;
  }

  // 2. Zod validation errors thrown directly (fallback — normally caught by validate())
  if (err instanceof ZodError) {
    fail(res, {
      statusCode: 400,
      code: 'BAD_REQUEST',
      message: 'Validation failed',
      details: {
        issues: err.issues.map((i) => ({
          path: i.path.join('.'),
          code: i.code,
          message: i.message,
        })),
      },
    });
    return;
  }

  // 3. Prisma known errors
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      fail(res, {
        statusCode: 409,
        code: 'CONFLICT',
        message: 'Unique constraint violation',
        details: { target: err.meta?.['target'] },
      });
      return;
    }
    if (err.code === 'P2025') {
      fail(res, {
        statusCode: 404,
        code: 'NOT_FOUND',
        message: 'Record not found',
      });
      return;
    }
    fail(res, {
      statusCode: 400,
      code: 'DATABASE_ERROR',
      message: 'Database request failed',
      details: isDev ? { prismaCode: err.code, meta: err.meta } : undefined,
    });
    return;
  }

  if (err instanceof Prisma.PrismaClientValidationError) {
    fail(res, {
      statusCode: 400,
      code: 'DATABASE_VALIDATION_ERROR',
      message: 'Invalid database query',
      details: isDev ? { raw: err.message } : undefined,
    });
    return;
  }

  // 4. Unknown / unhandled
  console.error('[error-handler] unhandled error:', err);
  fail(res, {
    statusCode: 500,
    code: 'INTERNAL_ERROR',
    message: 'Internal server error',
    details: isDev && err instanceof Error ? { stack: err.stack } : undefined,
  });
};
