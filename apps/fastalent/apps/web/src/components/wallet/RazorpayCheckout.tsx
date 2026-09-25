import { useCallback, useEffect, useRef } from 'react';

declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => RazorpayInstance;
  }
}

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  order_id: string;
  name: string;
  description: string;
  handler: (response: RazorpaySuccess) => void;
  modal?: { ondismiss?: () => void };
  theme?: { color: string };
}

interface RazorpayInstance {
  open: () => void;
}

export interface RazorpaySuccess {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

interface Props {
  orderId: string;
  amount: number;
  currency?: string;
  onSuccess: (response: RazorpaySuccess) => void;
  onDismiss?: () => void;
  trigger?: boolean;
}

const SCRIPT_ID = 'razorpay-checkout-js';
const SCRIPT_SRC = 'https://checkout.razorpay.com/v1/checkout.js';

function loadScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.getElementById(SCRIPT_ID)) {
      resolve();
      return;
    }
    const s = document.createElement('script');
    s.id = SCRIPT_ID;
    s.src = SCRIPT_SRC;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error('Failed to load Razorpay script'));
    document.body.appendChild(s);
  });
}

export default function RazorpayCheckout({
  orderId,
  amount,
  currency = 'INR',
  onSuccess,
  onDismiss,
  trigger,
}: Props) {
  const opened = useRef(false);

  const openCheckout = useCallback(async () => {
    if (opened.current) return;
    opened.current = true;
    try {
      await loadScript();
      const keyId = import.meta.env.VITE_RAZORPAY_KEY_ID;
      if (!keyId) throw new Error('VITE_RAZORPAY_KEY_ID not set');
      const rzp = new window.Razorpay({
        key: keyId,
        amount,
        currency,
        order_id: orderId,
        name: 'fastalent',
        description: 'Wallet top-up',
        handler: (res) => {
          opened.current = false;
          onSuccess(res);
        },
        modal: {
          ondismiss: () => {
            opened.current = false;
            onDismiss?.();
          },
        },
        theme: { color: '#059669' },
      });
      rzp.open();
    } catch {
      opened.current = false;
    }
  }, [orderId, amount, currency, onSuccess, onDismiss]);

  useEffect(() => {
    if (trigger) openCheckout();
  }, [trigger, openCheckout]);

  return null;
}
