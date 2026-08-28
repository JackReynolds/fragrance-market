const SUPPORTED_SALE_CURRENCIES = new Set(["eur", "gbp", "usd"]);

export const CHECKOUT_RESERVATION_MS = 30 * 60 * 1000;

export function isSupportedSaleCurrency(currency) {
  return SUPPORTED_SALE_CURRENCIES.has(currency);
}

export function calculatePlatformFee(amountCents) {
  return Math.round(amountCents * 0.05);
}
