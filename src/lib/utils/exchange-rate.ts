/**
 * Real-time exchange rate helper.
 * Source: open.er-api.com (free, no API key required)
 * Rates are cached in memory for 1 hour per currency to avoid hammering the API.
 */

const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

interface CacheEntry {
  ratesToMYR: number; // 1 [fromCurrency] = X MYR
  timestamp: number;
}

const cache = new Map<string, CacheEntry>();

/**
 * Returns the exchange rate: 1 unit of `fromCurrency` in MYR.
 * e.g. getMyrRate("USD") → 4.61 (meaning 1 USD = RM 4.61)
 */
export async function getMyrRate(fromCurrency: string): Promise<number> {
  const code = fromCurrency.trim().toUpperCase();
  if (code === "MYR") return 1;

  // Check in-memory cache
  const cached = cache.get(code);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    console.log(`[FX] cache hit ${code} → MYR: ${cached.ratesToMYR}`);
    return cached.ratesToMYR;
  }

  // Fetch from open.er-api.com — free tier, no auth
  const res = await fetch(`https://open.er-api.com/v6/latest/${code}`, {
    // Next.js ISR: revalidate every hour on the server
    next: { revalidate: 3600 },
  });

  if (!res.ok) {
    throw new Error(`Exchange rate API returned ${res.status} for currency "${code}"`);
  }

  const data = await res.json();

  if (data.result === "error") {
    throw new Error(`Unknown currency code "${code}": ${data["error-type"]}`);
  }

  const rate: number | undefined = data.rates?.MYR;
  if (!rate || isNaN(rate)) {
    throw new Error(`MYR rate not found in response for "${code}"`);
  }

  cache.set(code, { ratesToMYR: rate, timestamp: Date.now() });
  console.log(`[FX] fetched ${code} → MYR: ${rate}`);
  return rate;
}

/**
 * Convert an amount from any currency to MYR.
 * Returns original rate alongside the converted amount.
 */
export async function convertToMYR(
  amount: number,
  fromCurrency: string
): Promise<{ amountMYR: number; rate: number }> {
  const rate = await getMyrRate(fromCurrency);
  return { amountMYR: parseFloat((amount * rate).toFixed(2)), rate };
}

// Common currency display labels for the UI
export const CURRENCY_LABELS: Record<string, string> = {
  MYR: "RM",
  USD: "$",
  EUR: "€",
  GBP: "£",
  SGD: "S$",
  JPY: "¥",
  CNY: "¥",
  AUD: "A$",
  CAD: "C$",
  HKD: "HK$",
  KRW: "₩",
  THB: "฿",
  IDR: "Rp",
  INR: "₹",
  AED: "د.إ",
  SAR: "﷼",
  BDT: "৳",
  PHP: "₱",
  VND: "₫",
  TWD: "NT$",
};

export function currencySymbol(code: string): string {
  return CURRENCY_LABELS[code.toUpperCase()] ?? code;
}
