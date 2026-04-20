import { addMonths } from "date-fns";

function ymdKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** Calendar billing instant in UTC for a given month, clamped to the month’s last day (noon UTC). */
export function billingDateInMonthUtc(
  year: number,
  monthIndex0: number,
  billingDay: number,
): Date {
  const lastDay = new Date(Date.UTC(year, monthIndex0 + 1, 0)).getUTCDate();
  const day = Math.min(billingDay, lastDay);
  return new Date(Date.UTC(year, monthIndex0, day, 12, 0, 0, 0));
}

/** First billing date on or after the anchor’s UTC calendar day. */
export function firstDueOnOrAfterUtc(anchor: Date, billingDay: number): Date {
  const y = anchor.getUTCFullYear();
  const m = anchor.getUTCMonth();
  const d = anchor.getUTCDate();
  const anchorKey = ymdKey(new Date(Date.UTC(y, m, d, 12, 0, 0, 0)));
  const due = billingDateInMonthUtc(y, m, billingDay);
  if (ymdKey(due) >= anchorKey) return due;
  const next = addMonths(new Date(Date.UTC(y, m, 15, 12, 0, 0, 0)), 1);
  return billingDateInMonthUtc(
    next.getUTCFullYear(),
    next.getUTCMonth(),
    billingDay,
  );
}

export function nextBillingDateAfterUtc(
  currentDue: Date,
  billingDay: number,
): Date {
  const next = addMonths(currentDue, 1);
  return billingDateInMonthUtc(
    next.getUTCFullYear(),
    next.getUTCMonth(),
    billingDay,
  );
}

export function lastAllowedDueDateUtc(
  scheduleType: string,
  billingDay: number,
  untilYear: number | null,
  untilMonth: number | null,
): Date | null {
  if (scheduleType !== "until" || untilYear == null || untilMonth == null) {
    return null;
  }
  return billingDateInMonthUtc(untilYear, untilMonth - 1, billingDay);
}

/** Next billing on or after `ref`’s UTC calendar day, or null if the schedule has ended. */
export function nextDueOnOrAfterUtc(
  ref: Date,
  billingDay: number,
  createdAt: Date,
  scheduleType: string,
  untilYear: number | null,
  untilMonth: number | null,
): Date | null {
  const todayKey = ymdKey(ref);
  const last = lastAllowedDueDateUtc(
    scheduleType,
    billingDay,
    untilYear,
    untilMonth,
  );
  const lastKey = last ? ymdKey(last) : null;

  let cursor = firstDueOnOrAfterUtc(createdAt, billingDay);
  while (ymdKey(cursor) < todayKey) {
    cursor = nextBillingDateAfterUtc(cursor, billingDay);
    if (lastKey && ymdKey(cursor) > lastKey) return null;
  }
  if (lastKey && ymdKey(cursor) > lastKey) return null;
  return cursor;
}

export function utcDateKey(d: Date = new Date()): string {
  return d.toISOString().slice(0, 10);
}

/** Start of calendar month in UTC (for grouping charges). */
export function startOfMonthUtc(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1, 0, 0, 0, 0));
}

export function endOfMonthUtc(d: Date): Date {
  const y = d.getUTCFullYear();
  const m = d.getUTCMonth();
  const lastDay = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
  return new Date(Date.UTC(y, m, lastDay, 23, 59, 59, 999));
}
