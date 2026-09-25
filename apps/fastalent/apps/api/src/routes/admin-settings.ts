import { Router } from 'express';
import { UserRole } from '@gigcruite/types';
import { AppError } from '../lib/app-error.js';
import { ok } from '../lib/response.js';
import { authorize } from '../middleware/authorize.js';
import { rateLimitAuthenticated } from '../middleware/rate-limit.js';
import { validate } from '../middleware/validate.js';
import * as platformSettingsService from '../services/platform-settings.service.js';
import * as adminService from '../services/admin.service.js';
import * as countryConfigService from '../services/country-config.service.js';
import * as featureFlagService from '../services/feature-flag.service.js';
import { UpdateSettingSchema, type UpdateSettingBody } from '../validators/payout.js';
import {
  ListUsersQuerySchema,
  UpdateUserStatusSchema,
  UpdateCompanyCommissionSchema,
  ListRolesQuerySchema,
  ListEarningsQuerySchema,
  type ListUsersQuery,
  type UpdateUserStatusBody,
  type UpdateCompanyCommissionBody,
  type ListRolesQuery,
  type ListEarningsQuery,
} from '../validators/admin.js';
import {
  CreateCountryConfigSchema,
  UpdateCountryConfigSchema,
  type CreateCountryConfigBody,
  type UpdateCountryConfigBody,
} from '../validators/country-config.js';

const router = Router();

// ---- Platform metrics ----

router.get('/metrics', ...authorize(UserRole.ADMIN), rateLimitAuthenticated, async (_req, res) => {
  const metrics = await adminService.getMetrics();
  return ok(res, metrics);
});

// ---- User management ----

router.get('/users', ...authorize(UserRole.ADMIN), rateLimitAuthenticated, validate(ListUsersQuerySchema, 'query'), async (req, res) => {
  const filters = req.query as unknown as ListUsersQuery;
  const result = await adminService.listUsers(filters);
  return ok(res, result);
});

router.get('/users/:id', ...authorize(UserRole.ADMIN), rateLimitAuthenticated, async (req, res) => {
  const userId = req.params['id'] as string;
  const user = await adminService.getUserDetail(userId);
  return ok(res, user);
});

router.patch('/users/:id/status', ...authorize(UserRole.ADMIN), rateLimitAuthenticated, validate(UpdateUserStatusSchema), async (req, res) => {
  const userId = req.params['id'] as string;
  const { status } = req.body as UpdateUserStatusBody;
  const user = await adminService.updateUserStatus(userId, status);
  return ok(res, user);
});

router.post('/users/:id/reset-password', ...authorize(UserRole.ADMIN), rateLimitAuthenticated, async (req, res) => {
  const userId = req.params['id'] as string;
  const result = await adminService.forcePasswordReset(userId);
  return ok(res, result);
});

router.patch('/companies/:id/commission', ...authorize(UserRole.ADMIN), rateLimitAuthenticated, validate(UpdateCompanyCommissionSchema), async (req, res) => {
  const companyId = req.params['id'] as string;
  const { defaultCommissionPct } = req.body as UpdateCompanyCommissionBody;
  const result = await adminService.updateCompanyCommission(companyId, defaultCommissionPct);
  return ok(res, result);
});

// ---- All roles (admin view) ----

router.get('/roles', ...authorize(UserRole.ADMIN), rateLimitAuthenticated, validate(ListRolesQuerySchema, 'query'), async (req, res) => {
  const filters = req.query as unknown as ListRolesQuery;
  const result = await adminService.listAllRoles(filters);
  return ok(res, result);
});

// ---- Platform earnings (admin view) ----

router.get('/earnings', ...authorize(UserRole.ADMIN), rateLimitAuthenticated, validate(ListEarningsQuerySchema, 'query'), async (req, res) => {
  const filters = req.query as unknown as ListEarningsQuery;
  const result = await adminService.listPlatformEarnings(filters);
  return ok(res, result);
});

// ---- Settings (existing) ----

router.get('/settings', ...authorize(UserRole.ADMIN), rateLimitAuthenticated, async (_req, res) => {
  const settings = await platformSettingsService.getAllSettings();
  return ok(res, settings);
});

router.put('/settings/:key', ...authorize(UserRole.ADMIN), rateLimitAuthenticated, validate(UpdateSettingSchema), async (req, res) => {
  const result = await platformSettingsService.updateSetting(req.params['key'] as string, (req.body as UpdateSettingBody).value);
  return ok(res, result);
});

// ---- Feature flags ----

router.get('/feature-flags', ...authorize(UserRole.ADMIN), rateLimitAuthenticated, async (_req, res) => {
  const flags = await featureFlagService.listAllFlags();
  return ok(res, flags);
});

router.post('/feature-flags/flush-cache', ...authorize(UserRole.ADMIN), rateLimitAuthenticated, async (_req, res) => {
  const flushed = await featureFlagService.flushAllCaches();
  return ok(res, { flushed });
});

// ---- Country configs ----

router.get('/countries', ...authorize(UserRole.ADMIN), rateLimitAuthenticated, async (_req, res) => {
  const configs = await countryConfigService.listCountryConfigs();
  return ok(res, configs);
});

router.get('/countries/active', ...authorize(), rateLimitAuthenticated, async (_req, res) => {
  const configs = await countryConfigService.listCountryConfigs(true);
  return ok(res, configs);
});

router.get('/countries/:code', ...authorize(UserRole.ADMIN), rateLimitAuthenticated, async (req, res) => {
  const code = req.params['code'];
  if (typeof code !== 'string' || !code) throw AppError.badRequest('Country code is required');
  const config = await countryConfigService.getCountryConfig(code.toUpperCase());
  return ok(res, config);
});

router.post('/countries', ...authorize(UserRole.ADMIN), rateLimitAuthenticated, validate(CreateCountryConfigSchema), async (req, res) => {
  const input = req.body as CreateCountryConfigBody;
  const config = await countryConfigService.createCountryConfig(input);
  return ok(res, config, 201);
});

router.put('/countries/:code', ...authorize(UserRole.ADMIN), rateLimitAuthenticated, validate(UpdateCountryConfigSchema), async (req, res) => {
  const code = req.params['code'];
  if (typeof code !== 'string' || !code) throw AppError.badRequest('Country code is required');
  const input = req.body as UpdateCountryConfigBody;
  const config = await countryConfigService.updateCountryConfig(code.toUpperCase(), input);
  return ok(res, config);
});

export { router as adminSettingsRouter };
