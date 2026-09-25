/**
 * Shared currency formatter — replaces all per-page `formatInr` / `fmtInr` helpers.
 *
 * Uses `Intl.NumberFormat` with the correct locale and currency code.
 * Falls back to INR when the currency is unknown or missing.
 */

const CURRENCY_MAP: Record<string, { locale: string }> = {
  INR: { locale: 'en-IN' },
  USD: { locale: 'en-US' },
  GBP: { locale: 'en-GB' },
  EUR: { locale: 'de-DE' },
  AUD: { locale: 'en-AU' },
  AED: { locale: 'ar-AE' },
  SGD: { locale: 'en-SG' },
};

const formatters = new Map<string, Intl.NumberFormat>();

function getFormatter(currency: string): Intl.NumberFormat {
  const key = currency.toUpperCase();
  let fmt = formatters.get(key);
  if (!fmt) {
    const cfg = CURRENCY_MAP[key] ?? CURRENCY_MAP['INR']!;
    fmt = new Intl.NumberFormat(cfg.locale, {
      style: 'currency',
      currency: key,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });
    formatters.set(key, fmt);
  }
  return fmt;
}

/**
 * Format a numeric value as currency.
 *
 * @param value — string (from Decimal JSON) or number
 * @param currency — ISO 4217 code (default `'INR'`)
 */
export function formatCurrency(value: string | number, currency = 'INR'): string {
  const n = typeof value === 'string' ? Number(value) : value;
  if (!Number.isFinite(n)) return '—';
  return getFormatter(currency).format(n);
}
