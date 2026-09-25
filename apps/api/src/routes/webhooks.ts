import { Router, type Request, type Response } from 'express';
import { Prisma } from '@prisma/client';
import { prisma } from '../config/prisma.js';
import * as razorpayService from '../services/razorpay.service.js';
import * as companyWalletService from '../services/company-wallet.service.js';

/**
 * Webhook routes — mounted at /api/v1/webhooks.
 *
 * IMPORTANT: These routes receive raw body (not JSON-parsed) for signature
 * verification. The raw body middleware is mounted in app.ts BEFORE express.json().
 */

const router = Router();

// ────────────────────────────────────────────────────────────
// POST /webhooks/razorpay — Razorpay payment webhook
// ────────────────────────────────────────────────────────────

router.post('/razorpay', async (req: Request, res: Response) => {
  const signature = req.headers['x-razorpay-signature'] as string | undefined;
  if (!signature) {
    return res.status(400).json({ error: 'Missing signature header' });
  }

  // req.body is a raw Buffer when mounted with express.raw()
  const rawBody = req.body as Buffer;
  if (!Buffer.isBuffer(rawBody)) {
    return res.status(400).json({ error: 'Expected raw body' });
  }

  const valid = razorpayService.verifyWebhookSignature(rawBody, signature);
  if (!valid) {
    return res.status(401).json({ error: 'Invalid webhook signature' });
  }

  const event = JSON.parse(rawBody.toString('utf-8')) as {
    event: string;
    payload: {
      payment?: { entity: Record<string, unknown> };
      payout?: { entity: Record<string, unknown> };
    };
  };

  console.log(`[webhook/razorpay] received event: ${event.event}`);

  if (event.event === 'payment.captured' && event.payload.payment) {
    const payment = event.payload.payment.entity;
    const orderId = payment['order_id'] as string;
    const paymentId = payment['id'] as string;
    const amountPaise = payment['amount'] as number;
    const amountInr = new Prisma.Decimal(amountPaise).div(100);

    // Find which company this order belongs to by checking existing transaction metadata
    // or by looking up the order receipt format: gcw_{companyId_prefix}_{timestamp}
    const notes = (payment['notes'] ?? {}) as Record<string, string>;
    const companyId = notes['company_id'];

    if (companyId) {
      try {
        await prisma.$transaction(
          async (tx) => {
            await companyWalletService.depositFromRazorpay(
              companyId,
              amountInr,
              orderId,
              paymentId,
              tx as any,
            );
          },
          { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
        );
        console.log(`[webhook/razorpay] credited ₹${amountInr} to company ${companyId}`);
      } catch (err) {
        // Idempotent — duplicate is fine
        console.warn('[webhook/razorpay] deposit error (may be duplicate):', (err as Error).message);
      }
    }
  }

  // Payout webhooks (W3 will extend this)

  // Always return 200 to Razorpay to prevent retries
  return res.status(200).json({ status: 'ok' });
});

export { router as webhookRouter };
