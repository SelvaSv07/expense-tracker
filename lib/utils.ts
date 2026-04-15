import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Payment method as stored (e.g. on the transaction); trim only, preserve casing. */
export function formatPaymentMethodLabel(
  value: string | null | undefined,
): string {
  const s = value?.trim()
  if (!s) return "—"
  return s.replace(/_/g, " ")
}
