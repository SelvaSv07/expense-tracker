import {
  endOfDay,
  endOfMonth,
  endOfYear,
  startOfDay,
  startOfMonth,
  startOfYear,
} from "date-fns";

export type TimePreset = "today" | "month" | "year" | "custom";

export type TimeRange = { start: Date; end: Date };

export function getRangeFromPreset(
  preset: TimePreset,
  now = new Date(),
  custom?: { from: Date; to: Date },
): TimeRange {
  switch (preset) {
    case "today":
      return { start: startOfDay(now), end: endOfDay(now) };
    case "month":
      return { start: startOfMonth(now), end: endOfMonth(now) };
    case "year":
      return { start: startOfYear(now), end: endOfYear(now) };
    case "custom":
      if (!custom) {
        return { start: startOfMonth(now), end: endOfMonth(now) };
      }
      return {
        start: startOfDay(custom.from),
        end: endOfDay(custom.to),
      };
    default:
      return { start: startOfMonth(now), end: endOfMonth(now) };
  }
}

/** Previous period of same length for delta comparisons */
export function getPreviousRange(
  preset: TimePreset,
  now = new Date(),
  custom?: { from: Date; to: Date },
): TimeRange {
  const current = getRangeFromPreset(preset, now, custom);
  const ms = current.end.getTime() - current.start.getTime();
  const end = new Date(current.start.getTime() - 1);
  const start = new Date(end.getTime() - ms);
  return { start, end };
}

export function getYearRange(year: number): TimeRange {
  const d = new Date(year, 0, 15);
  return { start: startOfYear(d), end: endOfYear(d) };
}

export function monthsInYear(year: number): Date[] {
  return Array.from({ length: 12 }, (_, i) => new Date(year, i, 1));
}
