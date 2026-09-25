import { Router } from 'express';
import { ok } from '../lib/response.js';
import * as countryConfigService from '../services/country-config.service.js';

/**
 * Public routes — no authentication required.
 * Mounted at /api/v1 (same level as other routers).
 */
const router = Router();

/**
 * GET /countries — list active country configs.
 * Returns a slim payload: { countryCode, countryName, currencyCode, currencySymbol }.
 * Used by registration pages before the user is authenticated.
 */
router.get('/countries', async (_req, res) => {
  const configs = await countryConfigService.listCountryConfigs(true);
  const slim = configs.map((c) => ({
    countryCode: c.countryCode,
    countryName: c.countryName,
    currencyCode: c.currencyCode,
    currencySymbol: c.currencySymbol,
  }));
  ok(res, slim);
});

export { router as publicRouter };
