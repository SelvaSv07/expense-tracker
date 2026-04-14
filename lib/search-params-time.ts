import type { MonthRef, TimePreset } from "@/lib/time-range";

function parseMonthKey(raw: string | undefined): string | undefined {
  if (!raw || !/^\d{4}-\d{2}$/.test(raw)) return undefined;
  const [y, mo] = raw.split("-").map(Number);
  if (y < 2000 || y > 2100 || mo < 1 || mo > 12) return undefined;
  return `${y}-${String(mo).padStart(2, "0")}`;
}

export function parseTimeFromSearchParams(
  searchParams: Record<string, string | string[] | undefined>,
): {
  preset: TimePreset;
  custom?: { from: Date; to: Date };
  monthKey?: string;
  monthRef?: MonthRef;
} {
  const tf = typeof searchParams.tf === "string" ? searchParams.tf : "month";
  const from =
    typeof searchParams.from === "string" ? searchParams.from : undefined;
  const to =
    typeof searchParams.to === "string" ? searchParams.to : undefined;

  if (tf === "custom" && from && to) {
    return {
      preset: "custom",
      custom: { from: new Date(from), to: new Date(to) },
    };
  }

  if (tf === "today" || tf === "year") {
    return { preset: tf };
  }

  if (tf === "month") {
    const rawM =
      typeof searchParams.m === "string" ? searchParams.m : undefined;
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
    const from = custom.from.toISOString().slice(0, 10);
    const to = custom.to.toISOString().slice(0, 10);
    return `tf=custom&from=${from}&to=${to}`;
  }
  if (preset === "month" && opts?.monthKey) {
    return `tf=month&m=${opts.monthKey}`;
  }
  return `tf=${preset}`;
}
