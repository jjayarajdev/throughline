import { createHmac } from 'node:crypto';
import { env } from '../config/env.js';
import { AppError } from '../lib/app-error.js';

/**
 * Razorpay service — Phase 3.
 *
 * Uses Razorpay REST API directly (no npm SDK dependency needed for
 * the limited surface we use: create order + verify signature).
 * Amounts are in PAISE (1 INR = 100 paise).
 */

function assertConfigured(): void {
  if (!env.RAZORPAY_KEY_ID || !env.RAZORPAY_KEY_SECRET) {
    throw AppError.serviceUnavailable(
      'Payment provider not configured. Contact administrator.',
    );
  }
}

function authHeader(): string {
  return (
    'Basic ' +
    Buffer.from(`${env.RAZORPAY_KEY_ID}:${env.RAZORPAY_KEY_SECRET}`).toString('base64')
  );
}

export interface RazorpayOrder {
  id: string;
  amount: number;
  currency: string;
  receipt: string;
  status: string;
}

/**
 * Create a Razorpay order. Amount in INR (will be converted to paise).
 */
export async function createOrder(
  amountInr: number,
  receipt: string,
): Promise<RazorpayOrder> {
  assertConfigured();

  const amountPaise = Math.round(amountInr * 100);

  const res = await fetch('https://api.razorpay.com/v1/orders', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: authHeader(),
    },
    body: JSON.stringify({
      amount: amountPaise,
      currency: 'INR',
      receipt,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    console.error('[razorpay] order creation failed:', res.status, body);
    throw AppError.internal('Failed to create payment order');
  }

  return (await res.json()) as RazorpayOrder;
}

/**
 * Verify Razorpay payment signature (client-side callback).
 * Returns true if signature is valid.
 */
export function verifyPaymentSignature(
  orderId: string,
  paymentId: string,
  signature: string,
): boolean {
  assertConfigured();

  const expected = createHmac('sha256', env.RAZORPAY_KEY_SECRET!)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');

  return expected === signature;
}

/**
 * Verify Razorpay webhook signature.
 * Raw body must be the exact bytes Razorpay POSTed.
 */
export function verifyWebhookSignature(
  rawBody: Buffer,
  signature: string,
): boolean {
  if (!env.RAZORPAY_WEBHOOK_SECRET) return false;

  const expected = createHmac('sha256', env.RAZORPAY_WEBHOOK_SECRET)
    .update(rawBody)
    .digest('hex');

  return expected === signature;
}

/**
 * Fetch payment details from Razorpay.
 */
export async function fetchPayment(paymentId: string): Promise<Record<string, unknown>> {
  assertConfigured();

  const res = await fetch(`https://api.razorpay.com/v1/payments/${paymentId}`, {
    headers: { Authorization: authHeader() },
  });

  if (!res.ok) {
    throw AppError.internal('Failed to fetch payment details');
  }

  return (await res.json()) as Record<string, unknown>;
}
