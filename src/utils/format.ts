/**
 * Format a large number with commas for readability.
 */
export function formatNumber(value: string | number): string {
  const num = typeof value === "string" ? BigInt(value) : BigInt(Math.floor(value));
  return num.toLocaleString("en-US");
}

/**
 * Format a QU amount (Qubic Units) for display.
 * Qubic doesn't have decimals — 1 QU = 1 QU.
 */
export function formatQU(amount: string | number): string {
  return `${formatNumber(amount)} QU`;
}

/**
 * Safely extract a nested value from an unknown object.
 */
export function getField(obj: unknown, ...keys: string[]): unknown {
  let current: unknown = obj;
  for (const key of keys) {
    if (current === null || current === undefined || typeof current !== "object") {
      return undefined;
    }
    current = (current as Record<string, unknown>)[key];
  }
  return current;
}

/**
 * Format a timestamp (milliseconds string or number) to ISO date string.
 */
export function formatTimestamp(ts: string | number): string {
  const ms = typeof ts === "string" ? Number(ts) : ts;
  if (isNaN(ms) || ms === 0) return "N/A";
  return new Date(ms).toISOString();
}
