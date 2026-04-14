import {
  endOfDay,
  endOfMonth,
  endOfYear,
  startOfDay,
  startOfMonth,
  startOfYear,
  subMonths,
} from "date-fns";

export type TimePreset = "today" | "month" | "year" | "custom";

export type TimeRange = { start: Date; end: Date };

/** Calendar month selected via `?m=YYYY-MM` with `tf=month`. */
export type MonthRef = { year: number; monthIndex: number };

export function getRangeFromPreset(
  preset: TimePreset,
  now = new Date(),
  custom?: { from: Date; to: Date },
  monthRef?: MonthRef,
): TimeRange {
  switch (preset) {
    case "today":
      return { start: startOfDay(now), end: endOfDay(now) };
    case "month":
      if (monthRef) {
        const d = new Date(monthRef.year, monthRef.monthIndex, 1);
        return { start: startOfMonth(d), end: endOfMonth(d) };
      }
      return { start: startOfMonth(now), end: endOfMonth(now) };
    case "year": {
      const y = monthRef?.year ?? now.getFullYear();
      const d = new Date(y, monthRef?.monthIndex ?? 0, 1);
      return { start: startOfYear(d), end: endOfYear(d) };
    }
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
  monthRef?: MonthRef,
): TimeRange {
  if (preset === "month" && monthRef) {
    const cur = new Date(monthRef.year, monthRef.monthIndex, 1);
    const prev = subMonths(cur, 1);
    return { start: startOfMonth(prev), end: endOfMonth(prev) };
  }
  const current = getRangeFromPreset(preset, now, custom, monthRef);
  const ms = current.end.getTime() - current.start.getTime();
  const end = new Date(current.start.getTime() - 1);
  const start = new Date(end.getTime() - ms);
  return { start, end };
}

/** Which calendar month the weekly cash-flow chart should bucket (aligns with timeframe). */
export function getWeeklyChartMonthContext(
  preset: TimePreset,
  range: TimeRange,
  monthRef: MonthRef | undefined,
  now = new Date(),
): MonthRef {
  if (monthRef) return monthRef;
  if (preset === "month") {
    const d = startOfMonth(now);
    return { year: d.getFullYear(), monthIndex: d.getMonth() };
  }
  if (preset === "today") {
    const d = startOfMonth(now);
    return { year: d.getFullYear(), monthIndex: d.getMonth() };
  }
  if (preset === "custom") {
    const d = startOfMonth(range.start);
    return { year: d.getFullYear(), monthIndex: d.getMonth() };
  }
  if (preset === "year") {
    const y = range.start.getFullYear();
    if (now.getFullYear() === y)
      return { year: y, monthIndex: now.getMonth() };
    return { year: y, monthIndex: 0 };
  }
  const d = startOfMonth(now);
  return { year: d.getFullYear(), monthIndex: d.getMonth() };
}

export function getYearRange(year: number): TimeRange {
  const d = new Date(year, 0, 15);
  return { start: startOfYear(d), end: endOfYear(d) };
}

export function monthsInYear(year: number): Date[] {
  return Array.from({ length: 12 }, (_, i) => new Date(year, i, 1));
}
