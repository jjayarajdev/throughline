import jwt, { type SignOptions } from 'jsonwebtoken';
import type { UserRole } from '@gigcruite/types';
import { env } from '../config/env.js';
import { AppError } from './app-error.js';

/**
 * JWT sign/verify for access and refresh tokens.
 *
 * Design notes:
 *   - Two separate secrets — compromising the access key must not permit
 *     forging a refresh token (and vice-versa).
 *   - Refresh tokens carry a `jti` (random UUID) so the same userId can
 *     have different tokens across rotations, and the hashed copy in the
 *     users table can be compared against the exact one the client sent.
 *   - Access payload omits email/name — only `sub` and `role` are needed
 *     for authorization decisions. Everything else is fetched via /auth/me.
 */

export interface AccessTokenPayload {
  sub: string;
  role: UserRole;
  type: 'access';
}

export interface RefreshTokenPayload {
  sub: string;
  type: 'refresh';
  jti: string;
}

// jsonwebtoken's TS types want `string | number | StringValue` for expiresIn.
// Our env schema validates this as a plain string like '15m'. Cast once.
type Expiry = SignOptions['expiresIn'];

export function signAccessToken(userId: string, role: UserRole): string {
  const payload: AccessTokenPayload = { sub: userId, role, type: 'access' };
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_TTL as Expiry,
  });
}

export function signRefreshToken(userId: string, jti: string): string {
  const payload: RefreshTokenPayload = { sub: userId, type: 'refresh', jti };
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_TTL as Expiry,
  });
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  try {
    const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET);
    if (
      typeof decoded !== 'object' ||
      decoded === null ||
      (decoded as { type?: string }).type !== 'access' ||
      typeof (decoded as { sub?: unknown }).sub !== 'string' ||
      typeof (decoded as { role?: unknown }).role !== 'string'
    ) {
      throw AppError.unauthorized('Invalid access token');
    }
    const d = decoded as { sub: string; role: UserRole; type: 'access' };
    return { sub: d.sub, role: d.role, type: 'access' };
  } catch (err) {
    if (err instanceof AppError) throw err;
    if (err instanceof jwt.TokenExpiredError) {
      throw AppError.unauthorized('Access token expired');
    }
    throw AppError.unauthorized('Invalid access token');
  }
}

export function verifyRefreshToken(token: string): RefreshTokenPayload {
  try {
    const decoded = jwt.verify(token, env.JWT_REFRESH_SECRET);
    if (
      typeof decoded !== 'object' ||
      decoded === null ||
      (decoded as { type?: string }).type !== 'refresh' ||
      typeof (decoded as { sub?: unknown }).sub !== 'string' ||
      typeof (decoded as { jti?: unknown }).jti !== 'string'
    ) {
      throw AppError.unauthorized('Invalid refresh token');
    }
    const d = decoded as { sub: string; jti: string; type: 'refresh' };
    return { sub: d.sub, jti: d.jti, type: 'refresh' };
  } catch (err) {
    if (err instanceof AppError) throw err;
    if (err instanceof jwt.TokenExpiredError) {
      throw AppError.unauthorized('Refresh token expired');
    }
    throw AppError.unauthorized('Invalid refresh token');
  }
}
