import type { UserRole } from '../enums/user.js';

/**
 * Tokens pair issued by the auth service.
 * `refreshToken` is only ever carried over the wire through an httpOnly
 * cookie — it is NOT put in the JSON response body.
 */
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

/**
 * Shape of the signed JWT payload for ACCESS tokens.
 * Refresh tokens use a different minimal shape (see apps/api/src/lib/jwt.ts).
 */
export interface JwtPayload {
  sub: string;
  role: UserRole;
  iat: number;
  exp: number;
}

/**
 * Lightweight projection of the authenticated user, safe to send to the
 * client and to persist in localStorage. Never include passwordHash,
 * refreshTokenHash, encrypted PAN/bank fields, or any secrets here.
 *
 * `name` is derived on the server:
 *   - recruiter → RecruiterProfile.fullName
 *   - company   → CompanyProfile.companyName
 *   - admin     → email
 */
export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  emailVerified: boolean;
  name: string;
}

/** Response body for POST /auth/login and /auth/register. */
export interface LoginResponse {
  user: AuthUser;
  accessToken: string;
}

export type RegisterResponse = LoginResponse;

/** Response body for POST /auth/refresh — refresh cookie is rotated server-side. */
export interface RefreshResponse {
  accessToken: string;
}
