import type { MonthRef, TimePreset } from "@/lib/time-range";

function firstParamString(
  v: string | string[] | undefined,
): string | undefined {
  if (typeof v === "string") return v;
  if (Array.isArray(v)) {
    for (const x of v) {
      if (typeof x === "string" && x.length > 0) return x;
    }
  }
  return undefined;
}

function parseMonthKey(raw: string | undefined): string | undefined {
  if (!raw || !/^\d{4}-\d{2}$/.test(raw)) return undefined;
  const [y, mo] = raw.split("-").map(Number);
  if (y < 2000 || y > 2100 || mo < 1 || mo > 12) return undefined;
  return `${y}-${String(mo).padStart(2, "0")}`;
}

/** `YYYY-MM-DD` for the calendar day in the environment's local timezone (not UTC). */
export function formatLocalDateParam(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** Parse `YYYY-MM-DD` as that calendar day at local midnight (avoids UTC shift from `new Date("YYYY-MM-DD")`). */
export function parseLocalDateParam(ymd: string): Date | undefined {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ymd.trim());
  if (!m) return undefined;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const day = Number(m[3]);
  if (y < 2000 || y > 2100 || mo < 1 || mo > 12 || day < 1 || day > 31) return undefined;
  const d = new Date(y, mo - 1, day);
  if (
    d.getFullYear() !== y ||
    d.getMonth() !== mo - 1 ||
    d.getDate() !== day
  ) {
    return undefined;
  }
  return d;
}

export function parseTimeFromSearchParams(
  searchParams: Record<string, string | string[] | undefined>,
): {
  preset: TimePreset;
  custom?: { from: Date; to: Date };
  monthKey?: string;
  monthRef?: MonthRef;
} {
  const tf = firstParamString(searchParams.tf) ?? "month";
  const from = firstParamString(searchParams.from);
  const to = firstParamString(searchParams.to);

  if (tf === "custom" && from && to) {
    const fromD = parseLocalDateParam(from);
    const toD = parseLocalDateParam(to);
    if (fromD && toD) {
      return {
        preset: "custom",
        custom: { from: fromD, to: toD },
      };
    }
  }

  if (tf === "today") {
    return { preset: "today" };
  }

  if (tf === "year") {
    const rawM = firstParamString(searchParams.m);
    const monthKey = parseMonthKey(rawM);
    if (monthKey) {
      const [y, mo] = monthKey.split("-").map(Number);
      return {
        preset: "year",
        monthKey,
        monthRef: { year: y, monthIndex: mo - 1 },
      };
    }
    return { preset: "year" };
  }

  if (tf === "month") {
    const rawM = firstParamString(searchParams.m);
    const monthKey = parseMonthKey(rawM);
    if (monthKey) {
      const [y, mo] = monthKey.split("-").map(Number);
      return {
        preset: "month",
        monthKey,
        monthRef: { year: y, monthIndex: mo - 1 },
      };
    }
    return { preset: "month" };
  }

  return { preset: "month" };
}

export function timeQueryString(
  preset: TimePreset,
  custom?: { from: Date; to: Date },
  opts?: { monthKey?: string },
): string {
  if (preset === "custom" && custom) {
    const from = formatLocalDateParam(custom.from);
    const to = formatLocalDateParam(custom.to);
    return `tf=custom&from=${from}&to=${to}`;
  }
  if (preset === "month" && opts?.monthKey) {
    return `tf=month&m=${opts.monthKey}`;
  }
  if (preset === "year" && opts?.monthKey) {
    return `tf=year&m=${opts.monthKey}`;
  }
  return `tf=${preset}`;
}

/** Budget radar “last N months” window (query `radarMonths`). */
export const RADAR_WINDOW_MONTHS = [3, 6, 9, 12] as const;
export type RadarWindowMonths = (typeof RADAR_WINDOW_MONTHS)[number];

export function parseRadarWindowMonths(
  searchParams: Record<string, string | string[] | undefined>,
): RadarWindowMonths {
  const raw = firstParamString(searchParams.radarMonths);
  const n = raw ? Number.parseInt(raw, 10) : NaN;
  if (n === 3 || n === 6 || n === 9 || n === 12) return n;
  return 6;
}

/** Preserves the radar window when navigating months on the budget page. */
export function budgetMonthNavQuery(
  monthKey: string,
  radarMonths: RadarWindowMonths,
): string {
  const p = new URLSearchParams();
  p.set("tf", "month");
  p.set("m", monthKey);
  p.set("radarMonths", String(radarMonths));
  return p.toString();
}
