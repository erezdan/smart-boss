// utils/currencySymbol.js

// Static map for most common currencies (fast path)
export const STATIC_SYMBOLS = {
  USD: "$",
  ILS: "₪",
  EUR: "€",
  GBP: "£",
  JPY: "¥",
  CNY: "¥",
  HKD: "HK$",
  AUD: "A$",
  CAD: "C$",
  NZD: "NZ$",
  CHF: "CHF", // sometimes shown as "Fr"; choose what fits your UI
  SEK: "kr",
  NOK: "kr",
  DKK: "kr",
  PLN: "zł",
  CZK: "Kč",
  HUF: "Ft",
  INR: "₹",
  KRW: "₩",
  RUB: "₽",
  TRY: "₺",
  ZAR: "R",
  MXN: "MX$",
  BRL: "R$",
  ARS: "ARS",
  AED: "AED",
  SAR: "SAR",
  SGD: "S$",
  THB: "฿",
};

/**
 * Returns the currency symbol for a given ISO 4217 currency code.
 * @param {string} code - Currency code like "USD", "ILS", "EUR".
 * @param {string} [locale="en-US"] - Optional locale to influence symbol style.
 * @returns {string} Currency symbol (falls back to the code if unknown).
 */
export function getCurrencySymbol(code, locale = "en-US") {
  if (!code || typeof code !== "string") return "";

  const upper = code.toUpperCase().trim();

  // Fast path: static map
  if (STATIC_SYMBOLS[upper]) return STATIC_SYMBOLS[upper];

  try {
    // Use Intl to extract the symbol if available in the runtime
    const parts = new Intl.NumberFormat(locale, {
      style: "currency",
      currency: upper,
      currencyDisplay: "symbol",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).formatToParts(0);

    const symPart = parts.find((p) => p.type === "currency");
    if (symPart?.value) return symPart.value;
  } catch {
    // Ignore and fall back
  }

  // Last resort: return the code itself
  return upper;
}
