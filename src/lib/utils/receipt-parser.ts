/**
 * Robustly parse an amount value from any source.
 * Handles: numbers, strings like "RM 45.50", "45,50", "128.90", null, undefined
 */
export function parseReceiptAmount(raw: unknown): number {
  if (typeof raw === "number") return isNaN(raw) ? 0 : Math.round(raw * 100) / 100;
  if (typeof raw === "string") {
    const cleaned = raw.replace(/[^0-9.]/g, "");
    const num = parseFloat(cleaned);
    return isNaN(num) ? 0 : Math.round(num * 100) / 100;
  }
  return 0;
}
