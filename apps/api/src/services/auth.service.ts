import { createHash, randomBytes, randomUUID, timingSafeEqual } from 'node:crypto';
import bcrypt from 'bcryptjs';
import type { User } from '@prisma/client';
import type { AuthUser, UserRole } from '@gigcruite/types';
import { prisma } from '../config/prisma.js';
import { AppError } from '../lib/app-error.js';
import { toPrismaCompanySize } from '../lib/enum-bridge.js';
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from '../lib/jwt.js';
import {
  sendPasswordResetEmail,
  sendVerificationEmail,
} from './email.service.js';
import type {
  LoginInput,
  RegisterInput,
  ResetPasswordInput,
} from '../validators/auth.js';

// --- Tunables ---------------------------------------------------------------

const PASSWORD_ROUNDS = 12;
const LOCKOUT_THRESHOLD = 5;
const LOCKOUT_DURATION_MS = 30 * 60 * 1000; // 30 min
const VERIFY_TOKEN_BYTES = 32;
const RESET_TOKEN_BYTES = 32;
const RESET_TTL_MS = 60 * 60 * 1000; // 1 hour

// --- Helpers ----------------------------------------------------------------

function generateToken(bytes: number): string {
  return randomBytes(bytes).toString('hex');
}

/**
 * Hash a refresh token with SHA-256.
 *
 * We deliberately do NOT use bcrypt here: bcrypt truncates inputs to 72 bytes,
 * and JWT refresh tokens are ~250+ bytes whose first ~70 chars are nearly
 * identical across rotations (header + sub claim), which would make ALL
 * refresh tokens for a given user compare as equal — defeating reuse
 * detection entirely.
 *
 * SHA-256 is appropriate here because the refresh token is itself an
 * HMAC-SHA256 JWT signed with a 48-byte random secret: it already has
 * cryptographic entropy well beyond what bcrypt's KDF protects against.
 * The only purpose of hashing it server-side is so a DB dump doesn't
 * reveal active tokens — a simple digest covers that.
 */
function hashRefreshToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

/**
 * Constant-time string comparison. Used for refresh-token hash equality
 * checks so we don't leak hash byte positions through timing differences.
 */
function constantTimeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a, 'utf8');
  const bb = Buffer.from(b, 'utf8');
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}

function projectUser(user: User, name: string): AuthUser {
  return {
    id: user.id,
    email: user.email,
    role: user.role as UserRole,
    emailVerified: user.emailVerified,
    name,
  };
}

export interface IssuedTokens {
  accessToken: string;
  refreshToken: string;
}

/**
 * Issues a fresh access + refresh pair and stores the bcrypt hash of the
 * refresh token on the user row. This gives us the ability to detect
 * refresh-token reuse (stolen-token replay) by comparing the incoming
 * refresh against the stored hash during rotation.
 */
async function issueTokensForUser(
  userId: string,
  role: UserRole,
): Promise<IssuedTokens> {
  const jti = randomUUID();
  const accessToken = signAccessToken(userId, role);
  const refreshToken = signRefreshToken(userId, jti);
  const refreshTokenHash = hashRefreshToken(refreshToken);
  await prisma.user.update({
    where: { id: userId },
    data: { refreshTokenHash, lastLoginAt: new Date() },
  });
  return { accessToken, refreshToken };
}

// --- Register ---------------------------------------------------------------

export async function register(
  input: RegisterInput,
): Promise<{ user: AuthUser; tokens: IssuedTokens }> {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) {
    throw AppError.conflict('Email is already registered');
  }

  const passwordHash = await bcrypt.hash(input.password, PASSWORD_ROUNDS);
  const emailVerifyToken = generateToken(VERIFY_TOKEN_BYTES);

  const created = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        email: input.email,
        passwordHash,
        role: input.role,
        status: 'pending_verification',
        emailVerifyToken,
      },
    });

    if (input.role === 'recruiter') {
      await tx.recruiterProfile.create({
        data: {
          userId: user.id,
          fullName: input.fullName,
          phone: input.phone ?? null,
          ...(input.country ? { country: input.country } : {}),
          ...(input.currency ? { currency: input.currency } : {}),
        },
      });
    } else {
      const companyProfile = await tx.companyProfile.create({
        data: {
          userId: user.id,
          companyName: input.companyName,
          industry: input.industry ?? null,
          // CompanySize uses @map() on its enum values — schema-id
          // ("SIZE_11_50") vs DB value ("11-50") differ, so we must bridge
          // between the public-API enum and Prisma's client enum. See
          // apps/api/src/lib/enum-bridge.ts for the full explanation.
          companySize: toPrismaCompanySize(input.companySize),
          contactPerson: input.contactPerson ?? null,
          contactPhone: input.contactPhone ?? null,
          ...(input.country ? { country: input.country } : {}),
          ...(input.currency ? { currency: input.currency } : {}),
        },
      });

      // Phase 3: Create company wallet at registration time
      await tx.companyWallet.create({
        data: { companyId: companyProfile.id },
      });
    }

    return user;
  });

  // Fire off the verification email (console-logged in dev).
  // Non-fatal: a transient SMTP failure must not block registration.
  try {
    await sendVerificationEmail(created.email, emailVerifyToken);
  } catch (err) {
    console.warn('[auth] verification email failed (non-fatal):', (err as Error).message);
  }

  const name =
    input.role === 'recruiter' ? input.fullName : input.companyName;
  const tokens = await issueTokensForUser(created.id, created.role as UserRole);
  return { user: projectUser(created, name), tokens };
}

// --- Login ------------------------------------------------------------------

export async function login(
  input: LoginInput,
): Promise<{ user: AuthUser; tokens: IssuedTokens }> {
  const user = await prisma.user.findUnique({
    where: { email: input.email },
    include: { recruiterProfile: true, companyProfile: true },
  });

  // Generic message on either branch — no user-enumeration oracle.
  const invalidCreds = AppError.unauthorized('Invalid email or password');

  if (!user) {
    throw invalidCreds;
  }

  // Account lockout takes precedence over a bad-password retry storm.
  if (user.lockedUntil && user.lockedUntil > new Date()) {
    throw AppError.unauthorized(
      'Account is temporarily locked due to too many failed login attempts. Please try again later.',
    );
  }

  const passwordOk = await bcrypt.compare(input.password, user.passwordHash);
  if (!passwordOk) {
    const attempts = user.failedLoginAttempts + 1;
    const shouldLock = attempts >= LOCKOUT_THRESHOLD;
    await prisma.user.update({
      where: { id: user.id },
      data: {
        failedLoginAttempts: attempts,
        lockedUntil: shouldLock ? new Date(Date.now() + LOCKOUT_DURATION_MS) : null,
      },
    });
    throw invalidCreds;
  }

  // UserStatus gate — must run AFTER the password check so that an
  // unverified user can't be enumerated by a wrong-password probe
  // (wrong pwd still returns the generic 401 above). All three non-active
  // states short-circuit with 403 Forbidden + a status-specific message.
  if (user.status === 'pending_verification') {
    throw AppError.forbidden(
      'Please verify your email address before logging in. Check your inbox for the verification link.',
    );
  }
  if (user.status === 'inactive') {
    throw AppError.forbidden(
      'Account is inactive. Please contact support to reactivate.',
    );
  }
  if (user.status === 'blocked') {
    throw AppError.forbidden('Account is blocked. Contact support.');
  }

  // Successful login — reset counters if they were set.
  if (user.failedLoginAttempts > 0 || user.lockedUntil) {
    await prisma.user.update({
      where: { id: user.id },
      data: { failedLoginAttempts: 0, lockedUntil: null },
    });
  }

  const name =
    user.recruiterProfile?.fullName ??
    user.companyProfile?.companyName ??
    user.email;
  const tokens = await issueTokensForUser(user.id, user.role as UserRole);
  return { user: projectUser(user, name), tokens };
}

// --- Refresh (with reuse detection) -----------------------------------------

/**
 * Rotates refresh tokens with detection of replay attacks.
 *
 * Flow:
 *   1. Verify JWT signature + expiry.
 *   2. Load the user and check that they still have a stored refresh hash
 *      (logout / password-reset clears this, so those paths force re-login).
 *   3. bcrypt.compare against the stored hash. If it does NOT match, we
 *      assume the attacker is replaying a stolen OLD refresh token whose
 *      hash we already overwrote during a previous rotation. Nuke the
 *      current refresh hash so both the attacker AND the legitimate user
 *      are kicked out — they'll have to re-login, which is the only safe
 *      action when we cannot distinguish the two.
 *   4. If it matches, issue a fresh pair and overwrite the stored hash.
 */
export async function refresh(refreshToken: string): Promise<IssuedTokens> {
  const payload = verifyRefreshToken(refreshToken);

  const user = await prisma.user.findUnique({ where: { id: payload.sub } });
  if (!user || !user.refreshTokenHash) {
    throw AppError.unauthorized('Session expired — please log in again');
  }

  const incomingHash = hashRefreshToken(refreshToken);
  const matches = constantTimeEqual(incomingHash, user.refreshTokenHash);
  if (!matches) {
    // REUSE DETECTED: invalidate everything for this user.
    await prisma.user.update({
      where: { id: user.id },
      data: { refreshTokenHash: null },
    });
    throw AppError.unauthorized(
      'Refresh token reuse detected — all sessions have been invalidated',
    );
  }

  return issueTokensForUser(user.id, user.role as UserRole);
}

// --- Logout -----------------------------------------------------------------

export async function logout(userId: string): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: { refreshTokenHash: null },
  });
}

// --- Forgot / reset password ------------------------------------------------

/**
 * Generates a password reset token and emails the link.
 * ALWAYS resolves without revealing whether the email exists.
 */
export async function forgotPassword(email: string): Promise<void> {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return;

  const token = generateToken(RESET_TOKEN_BYTES);
  const expiry = new Date(Date.now() + RESET_TTL_MS);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordResetToken: token,
      passwordResetExpiry: expiry,
    },
  });

  try {
    await sendPasswordResetEmail(user.email, token);
  } catch (err) {
    console.warn('[auth] password reset email failed (non-fatal):', (err as Error).message);
  }
}

export async function resetPassword(input: ResetPasswordInput): Promise<void> {
  const user = await prisma.user.findFirst({
    where: {
      passwordResetToken: input.token,
      passwordResetExpiry: { gt: new Date() },
    },
  });
  if (!user) {
    throw AppError.badRequest('Invalid or expired reset token');
  }

  const passwordHash = await bcrypt.hash(input.password, PASSWORD_ROUNDS);
  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash,
      passwordResetToken: null,
      passwordResetExpiry: null,
      failedLoginAttempts: 0,
      lockedUntil: null,
      // Password changed → invalidate any active refresh token so all
      // existing sessions are forced to re-authenticate.
      refreshTokenHash: null,
    },
  });
}

// --- Email verification -----------------------------------------------------

export async function verifyEmail(token: string): Promise<void> {
  const user = await prisma.user.findFirst({
    where: { emailVerifyToken: token },
  });
  if (!user) {
    throw AppError.badRequest('Invalid verification token');
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      emailVerified: true,
      emailVerifiedAt: new Date(),
      emailVerifyToken: null,
      // Auto-activate accounts that were waiting only for email verification.
      status: user.status === 'pending_verification' ? 'active' : user.status,
    },
  });
}

// --- Dev-only token issuer (no password check) ------------------------------

export const devIssueTokens = issueTokensForUser;

// --- Current user (for /auth/me) --------------------------------------------

export async function getUserById(userId: string): Promise<AuthUser | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { recruiterProfile: true, companyProfile: true },
  });
  if (!user) return null;
  const name =
    user.recruiterProfile?.fullName ??
    user.companyProfile?.companyName ??
    user.email;
  return projectUser(user, name);
}
