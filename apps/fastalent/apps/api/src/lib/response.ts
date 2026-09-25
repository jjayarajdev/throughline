import type { Response } from 'express';
import type { ApiErrorResponse, ApiSuccessResponse } from '@gigcruite/types';

/**
 * Success envelope — sends 200 by default.
 */
export function ok<T>(res: Response, data: T, statusCode = 200): Response {
  const body: ApiSuccessResponse<T> = {
    success: true,
    data,
    meta: {
      timestamp: new Date().toISOString(),
      ...(res.locals['requestId'] ? { requestId: res.locals['requestId'] as string } : {}),
    },
  };
  return res.status(statusCode).json(body);
}

/**
 * Error envelope — sends given status code (default 500).
 */
export function fail(
  res: Response,
  params: { code: string; message: string; details?: unknown; statusCode?: number },
): Response {
  const body: ApiErrorResponse = {
    success: false,
    error: {
      code: params.code,
      message: params.message,
      ...(params.details !== undefined ? { details: params.details } : {}),
    },
    meta: {
      timestamp: new Date().toISOString(),
      ...(res.locals['requestId'] ? { requestId: res.locals['requestId'] as string } : {}),
    },
  };
  return res.status(params.statusCode ?? 500).json(body);
}
