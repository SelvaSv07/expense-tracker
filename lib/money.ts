/**
 * Monetary `amount` fields in the database are integers in whole rupees (₹).
 */

const inrFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

/** Format a stored integer amount (rupees) for display. */
export function formatInr(amount: number): string {
  return inrFormatter.format(amount);
}

/** Parse user input (e.g. "1,234") into rupees for storage. */
export function parseInrInput(value: string): number {
  const n = Number.parseFloat(value.replace(/,/g, "").replace(/[^0-9.-]/g, ""));
  if (Number.isNaN(n)) return 0;
  return Math.round(n);
}
