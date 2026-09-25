import express, { type Express, type Request, type Response, type NextFunction } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { randomUUID } from 'node:crypto';

import { env } from './config/env.js';
import { apiRouter } from './routes/index.js';
import { errorHandler, notFoundHandler } from './middleware/error-handler.js';

/**
 * Express 5 application factory.
 * Express 5 automatically forwards async rejections to the error middleware,
 * so route handlers can `throw` freely without try/catch wrappers.
 */
export function createApp(): Express {
  const app = express();

  // Behind an AWS load balancer / reverse proxy later — trust X-Forwarded-*
  app.set('trust proxy', 1);
  app.disable('x-powered-by');

  // Security headers
  app.use(
    helmet({
      contentSecurityPolicy: false, // API-only, no inline content
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );

  // CORS — web app origin
  app.use(
    cors({
      origin: env.CORS_ORIGIN.split(',').map((o) => o.trim()),
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id'],
      exposedHeaders: ['X-Request-Id'],
    }),
  );

  // Webhook routes need raw body for signature verification — mount BEFORE json parser.
  app.use('/api/v1/webhooks', express.raw({ type: 'application/json', limit: '1mb' }));

  // Parsers
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));
  app.use(cookieParser());

  // Request ID + minimal request logging
  app.use((req: Request, res: Response, next: NextFunction) => {
    const requestId = (req.header('X-Request-Id') ?? randomUUID()).slice(0, 64);
    res.locals['requestId'] = requestId;
    res.setHeader('X-Request-Id', requestId);
    const start = Date.now();
    res.on('finish', () => {
      const ms = Date.now() - start;
      console.log(
        `[${new Date().toISOString()}] ${req.method} ${req.originalUrl} → ${res.statusCode} (${ms}ms) [${requestId}]`,
      );
    });
    next();
  });

  // API routes
  app.use('/api/v1', apiRouter);

  // Root ping
  app.get('/', (_req, res) => {
    res.json({ service: 'gigcruite-api', status: 'running', version: '0.1.0' });
  });

  // 404 + global error handler (must be last)
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
