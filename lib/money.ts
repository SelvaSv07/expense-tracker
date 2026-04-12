/**
 * Monetary `amount` fields in the database are integers in paisa (100 paisa = ₹1).
 */

const inrFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** Format a stored integer amount (paisa) for display. */
export function formatInr(amount: number): string {
  return inrFormatter.format(amount / 100);
}

/** Parse user input (e.g. "1,234.56") into paisa for storage. */
export function parseInrInput(value: string): number {
  const n = Number.parseFloat(value.replace(/,/g, "").replace(/[^0-9.-]/g, ""));
  if (Number.isNaN(n)) return 0;
  return Math.round(n * 100);
}
