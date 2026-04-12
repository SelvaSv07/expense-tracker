import type { TimePreset } from "@/lib/time-range";

export function parseTimeFromSearchParams(
  searchParams: Record<string, string | string[] | undefined>,
): {
  preset: TimePreset;
  custom?: { from: Date; to: Date };
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

  if (tf === "today" || tf === "month" || tf === "year") {
    return { preset: tf };
  }

  return { preset: "month" };
}

export function timeQueryString(
  preset: TimePreset,
  custom?: { from: Date; to: Date },
): string {
  if (preset === "custom" && custom) {
    const from = custom.from.toISOString().slice(0, 10);
    const to = custom.to.toISOString().slice(0, 10);
    return `tf=custom&from=${from}&to=${to}`;
  }
  return `tf=${preset}`;
}
