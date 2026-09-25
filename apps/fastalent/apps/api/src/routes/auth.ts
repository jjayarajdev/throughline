import { Router, type Request, type Response } from 'express';
import { env } from '../config/env.js';
import { AppError } from '../lib/app-error.js';
import { ok } from '../lib/response.js';
import { authenticate } from '../middleware/authenticate.js';
import { rateLimitAuthenticated } from '../middleware/rate-limit.js';
import { validate } from '../middleware/validate.js';
import * as authService from '../services/auth.service.js';
import {
  ForgotPasswordSchema,
  LoginSchema,
  RegisterSchema,
  ResetPasswordSchema,
  VerifyEmailSchema,
  type ForgotPasswordInput,
  type LoginInput,
  type RegisterInput,
  type ResetPasswordInput,
  type VerifyEmailInput,
} from '../validators/auth.js';

/**
 * Authentication routes — all mounted at /api/v1/auth.
 *
 * Refresh token transport:
 *   The refresh token is ALWAYS delivered via an httpOnly cookie so it's
 *   invisible to page JS (mitigates XSS token theft). The axios client on
 *   the web app uses `withCredentials: true` so the cookie automatically
 *   rides along on /auth/refresh calls.
 *
 * Public vs authenticated limiting:
 *   - /register, /login, /refresh, /forgot-password, /reset-password,
 *     /verify-email are covered by `rateLimitPublic` already mounted at
 *     the parent router level.
 *   - /logout and /me go through `authenticate` + `rateLimitAuthenticated`
 *     so authenticated clients get the higher 60/min budget keyed by
 *     userId instead of by IP.
 */

const REFRESH_COOKIE = 'gigcruite_refresh';
const REFRESH_COOKIE_PATH = '/api/v1/auth';
const REFRESH_COOKIE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

function setRefreshCookie(res: Response, token: string): void {
  res.cookie(REFRESH_COOKIE, token, {
    httpOnly: true,
    // HTTPS only in prod — dev runs over http://localhost.
    secure: env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: REFRESH_COOKIE_PATH,
    maxAge: REFRESH_COOKIE_MAX_AGE_MS,
  });
}

function clearRefreshCookie(res: Response): void {
  res.clearCookie(REFRESH_COOKIE, { path: REFRESH_COOKIE_PATH });
}

function getRefreshCookie(req: Request): string | undefined {
  const cookies = (req as Request & { cookies?: Record<string, string> }).cookies;
  return cookies?.[REFRESH_COOKIE];
}

const router = Router();

// ---- POST /auth/register ---------------------------------------------------

router.post('/register', validate(RegisterSchema), async (req, res) => {
  const input = req.body as RegisterInput;
  const { user, tokens } = await authService.register(input);
  setRefreshCookie(res, tokens.refreshToken);
  ok(res, { user, accessToken: tokens.accessToken }, 201);
});

// ---- POST /auth/login ------------------------------------------------------

router.post('/login', validate(LoginSchema), async (req, res) => {
  const input = req.body as LoginInput;
  const { user, tokens } = await authService.login(input);
  setRefreshCookie(res, tokens.refreshToken);
  ok(res, { user, accessToken: tokens.accessToken });
});

// ---- POST /auth/refresh ----------------------------------------------------

router.post('/refresh', async (req, res) => {
  const refreshToken = getRefreshCookie(req);
  if (!refreshToken) {
    throw AppError.unauthorized('Missing refresh token');
  }
  const tokens = await authService.refresh(refreshToken);
  setRefreshCookie(res, tokens.refreshToken);
  ok(res, { accessToken: tokens.accessToken });
});

// ---- POST /auth/logout -----------------------------------------------------

router.post(
  '/logout',
  authenticate,
  rateLimitAuthenticated,
  async (req, res) => {
    if (req.userId) {
      await authService.logout(req.userId);
    }
    clearRefreshCookie(res);
    ok(res, { success: true });
  },
);

// ---- POST /auth/forgot-password --------------------------------------------

router.post(
  '/forgot-password',
  validate(ForgotPasswordSchema),
  async (req, res) => {
    const input = req.body as ForgotPasswordInput;
    await authService.forgotPassword(input.email);
    // Generic response — never leak whether the email exists.
    ok(res, { success: true });
  },
);

// ---- POST /auth/reset-password ---------------------------------------------

router.post(
  '/reset-password',
  validate(ResetPasswordSchema),
  async (req, res) => {
    const input = req.body as ResetPasswordInput;
    await authService.resetPassword(input);
    ok(res, { success: true });
  },
);

// ---- POST /auth/verify-email -----------------------------------------------

router.post(
  '/verify-email',
  validate(VerifyEmailSchema),
  async (req, res) => {
    const input = req.body as VerifyEmailInput;
    await authService.verifyEmail(input.token);
    ok(res, { success: true });
  },
);

// ---- GET /auth/me ----------------------------------------------------------

router.get('/me', authenticate, rateLimitAuthenticated, async (req, res) => {
  const user = await authService.getUserById(req.userId!);
  if (!user) {
    throw AppError.notFound('User not found');
  }
  ok(res, user);
});

// ---- DEV-ONLY: Quick-login panel --------------------------------------------

if (env.NODE_ENV !== 'production') {
  /** GET /auth/dev-users — list all company + recruiter users for quick login. */
  router.get('/dev-users', async (_req, res) => {
    const users = await (await import('../config/prisma.js')).prisma.user.findMany({
      where: { role: { in: ['company', 'recruiter'] } },
      orderBy: [{ role: 'asc' }, { email: 'asc' }],
      include: {
        recruiterProfile: { select: { fullName: true } },
        companyProfile: { select: { companyName: true } },
      },
    });
    ok(res, users.map((u) => ({
      id: u.id,
      email: u.email,
      role: u.role,
      status: u.status,
      name: u.recruiterProfile?.fullName ?? u.companyProfile?.companyName ?? u.email,
    })));
  });

  /** POST /auth/dev-login — issue real tokens for a userId without password. */
  router.post('/dev-login', async (req, res) => {
    const { userId } = req.body as { userId: string };
    if (!userId) throw AppError.badRequest('userId is required');

    const user = await (await import('../config/prisma.js')).prisma.user.findUnique({
      where: { id: userId },
      include: { recruiterProfile: true, companyProfile: true },
    });
    if (!user) throw AppError.notFound('User not found');

    // Block non-active users from dev login
    if (user.status !== 'active') {
      throw AppError.forbidden(`Cannot sign in: account is ${user.status}`);
    }

    const { UserRole } = await import('@gigcruite/types');
    const tokens = await authService.devIssueTokens(user.id, user.role as typeof UserRole[keyof typeof UserRole]);
    const name = user.recruiterProfile?.fullName ?? user.companyProfile?.companyName ?? user.email;

    setRefreshCookie(res, tokens.refreshToken);
    ok(res, {
      user: { id: user.id, email: user.email, role: user.role, emailVerified: user.emailVerified, name },
      accessToken: tokens.accessToken,
    });
  });
}

export { router as authRouter };
