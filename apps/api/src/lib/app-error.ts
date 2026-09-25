/**
 * AppError — structured error with HTTP status, stable code, and optional details.
 * Thrown from services/middleware; caught by the global error handler and converted
 * into an ApiErrorResponse envelope.
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details?: unknown;
  public readonly isOperational: boolean;

  constructor(params: {
    statusCode: number;
    code: string;
    message: string;
    details?: unknown;
    isOperational?: boolean;
  }) {
    super(params.message);
    this.name = 'AppError';
    this.statusCode = params.statusCode;
    this.code = params.code;
    this.details = params.details;
    this.isOperational = params.isOperational ?? true;
    Error.captureStackTrace?.(this, AppError);
  }

  static badRequest(message = 'Bad request', details?: unknown): AppError {
    return new AppError({ statusCode: 400, code: 'BAD_REQUEST', message, details });
  }

  static unauthorized(message = 'Unauthorized', details?: unknown): AppError {
    return new AppError({ statusCode: 401, code: 'UNAUTHORIZED', message, details });
  }

  static forbidden(message = 'Forbidden', details?: unknown): AppError {
    return new AppError({ statusCode: 403, code: 'FORBIDDEN', message, details });
  }

  static notFound(message = 'Not found', details?: unknown): AppError {
    return new AppError({ statusCode: 404, code: 'NOT_FOUND', message, details });
  }

  static conflict(message = 'Conflict', details?: unknown): AppError {
    return new AppError({ statusCode: 409, code: 'CONFLICT', message, details });
  }

  static unprocessable(message = 'Unprocessable entity', details?: unknown): AppError {
    return new AppError({ statusCode: 422, code: 'UNPROCESSABLE_ENTITY', message, details });
  }

  static tooMany(message = 'Too many requests', details?: unknown): AppError {
    return new AppError({ statusCode: 429, code: 'TOO_MANY_REQUESTS', message, details });
  }

  static serviceUnavailable(message = 'Service unavailable', details?: unknown): AppError {
    return new AppError({ statusCode: 503, code: 'SERVICE_UNAVAILABLE', message, details });
  }

  static internal(message = 'Internal server error', details?: unknown): AppError {
    return new AppError({
      statusCode: 500,
      code: 'INTERNAL_ERROR',
      message,
      details,
      isOperational: false,
    });
  }
}
