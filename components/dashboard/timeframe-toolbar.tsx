"use client";

import { CustomRangePicker } from "@/components/dashboard/custom-range-picker";
import { Button, buttonVariants } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  parseLocalDateParam,
  timeQueryString,
} from "@/lib/search-params-time";
import type { TimePreset } from "@/lib/time-range";
import { cn } from "@/lib/utils";
import {
  CalendarDays,
  CalendarRange,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { endOfDay, startOfDay, startOfMonth, subMonths } from "date-fns";

const labels: Record<TimePreset, string> = {
  today: "Today",
  month: "This Month",
  year: "This Year",
  custom: "Custom range",
};

function formatMonthPickLabel(monthKey: string): string {
  const [y, mo] = monthKey.split("-").map(Number);
  return new Date(y, mo - 1, 1).toLocaleString("en-US", {
    month: "long",
    year: "numeric",
  });
}

function recentMonthKeys(now: Date, count: number): { key: string; label: string }[] {
  const out: { key: string; label: string }[] = [];
  let d = startOfMonth(now);
  for (let i = 0; i < count; i++) {
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    out.push({
      key,
      label: d.toLocaleString("en-US", { month: "long", year: "numeric" }),
    });
    d = subMonths(d, 1);
  }
  return out;
}

/** Button label for applied custom range — matches export-style compact date readout (e.g. Oct 01 – Oct 15, 2026). */
function formatCazuraCustomTrigger(from: Date, to: Date): string {
  const fromD = startOfDay(from);
  const toD = startOfDay(to);
  const sameYear = fromD.getFullYear() === toD.getFullYear();
  const fromStr = fromD.toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
  });
  const toStr = toD.toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
  if (sameYear) {
    return `${fromStr} – ${toStr}`;
  }
  const fromWithYear = fromD.toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
  return `${fromWithYear} – ${toStr}`;
}

function parseCustomRangeFromSearchParams(
  searchParams: ReturnType<typeof useSearchParams>,
): { from: Date; to: Date } | undefined {
  if (searchParams.get("tf") !== "custom") return undefined;
  const fromRaw = searchParams.get("from");
  const toRaw = searchParams.get("to");
  if (!fromRaw || !toRaw) return undefined;
  const from = parseLocalDateParam(fromRaw);
  const to = parseLocalDateParam(toRaw);
  if (!from || !to) return undefined;
  return { from, to };
}

/**
 * Calendar shell + weekday row for custom range.
 * Only pass keys we must override: `Calendar` applies `...classNames` last and replaces
 * merged defaults per key, so we must not override `day` / `week` / `month` or layout breaks.
 */
const cazuraCalendarClassNames = {
  root: cn(
    "overflow-hidden rounded-xl border p-2 shadow-none",
    "border-[var(--cazura-border)] bg-[var(--cazura-panel)]",
  ),
  /** Same flex model as date rows: seven equal columns, centered labels. */
  weekdays: "mb-1.5 flex w-full",
  weekday: cn(
    "flex min-h-6 flex-1 basis-0 items-center justify-center px-0.5",
    "text-center text-[0.72rem] font-medium leading-none tracking-wide",
    "text-[var(--cazura-label)]",
  ),
};

function CazuraTimeframeMenu({
  basePath,
  preset,
  custom,
}: {
  basePath: string;
  preset: TimePreset;
  custom?: { from: Date; to: Date };
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);
  const [showCustomPanel, setShowCustomPanel] = useState(false);
  const [draftFrom, setDraftFrom] = useState<Date | undefined>();
  const [draftTo, setDraftTo] = useState<Date | undefined>();

  const effectiveCustom =
    custom ??
    (preset === "custom"
      ? parseCustomRangeFromSearchParams(searchParams)
      : undefined);

  function mergePush(mutate: (p: URLSearchParams) => void) {
    const p = new URLSearchParams(searchParams.toString());
    mutate(p);
    if (p.get("tf") !== "custom") {
      p.delete("from");
      p.delete("to");
    }
    const qs = p.toString();
    router.push(qs ? `${basePath}?${qs}` : basePath);
  }

  function seedCustomDrafts() {
    const range =
      custom ?? parseCustomRangeFromSearchParams(searchParams);
    if (preset === "custom" && range) {
      setDraftFrom(startOfDay(range.from));
      setDraftTo(startOfDay(range.to));
    } else {
      const now = new Date();
      setDraftFrom(startOfMonth(now));
      setDraftTo(startOfDay(now));
    }
  }

  function onOpenChange(next: boolean) {
    setOpen(next);
    if (next) {
      if (preset === "custom") {
        setShowCustomPanel(true);
        seedCustomDrafts();
      } else {
        setShowCustomPanel(false);
      }
    } else {
      setShowCustomPanel(false);
    }
  }

  const triggerLabel =
    preset === "custom" && effectiveCustom
      ? formatCazuraCustomTrigger(
          effectiveCustom.from,
          effectiveCustom.to,
        )
      : labels[preset];

  function navigatePreset(p: "today" | "month" | "year") {
    mergePush((params) => {
      const q = timeQueryString(p);
      for (const [k, v] of new URLSearchParams(q)) {
        params.set(k, v);
      }
      params.delete("m");
    });
    setOpen(false);
  }

  function applyCustom() {
    if (!draftFrom || !draftTo) return;
    let from = startOfDay(draftFrom);
    let to = startOfDay(draftTo);
    if (from.getTime() > to.getTime()) {
      const s = from;
      from = to;
      to = s;
    }
    mergePush((params) => {
      const q = new URLSearchParams(
        timeQueryString("custom", { from, to: endOfDay(to) }),
      );
      for (const [k, v] of q) {
        params.set(k, v);
      }
      params.delete("m");
    });
    setOpen(false);
  }

  const canApply = Boolean(draftFrom && draftTo);

  /** Same visual language as `DropdownMenuItem` (Export PDF / Excel menu). */
  const exportMenuRow = cn(
    "relative flex w-full cursor-pointer items-center gap-1.5 rounded-md px-1.5 py-1 text-left text-sm outline-none select-none",
    "text-popover-foreground hover:bg-accent hover:text-accent-foreground",
    "focus-visible:bg-accent focus-visible:text-accent-foreground",
  );

  const presetRows = (["today", "month", "year"] as const).map((p) => {
    const selected =
      !showCustomPanel &&
      (p === "month" ? preset === "month" : preset === p);
    return (
      <button
        key={p}
        type="button"
        onClick={() => navigatePreset(p)}
        className={cn(exportMenuRow, selected && "bg-accent text-accent-foreground")}
      >
        {labels[p]}
      </button>
    );
  });

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger
        className={cn(
          buttonVariants({ variant: "outline", size: "sm" }),
          "h-8 min-w-0 cursor-pointer gap-1.5 rounded-lg border px-3 text-xs font-medium shadow-none",
        )}
        style={{
          background: "var(--cazura-panel)",
          borderColor: "var(--cazura-border)",
          color: "var(--cazura-text)",
        }}
      >
        <CalendarDays className="size-3.5 shrink-0" strokeWidth={1.8} />
        <span className="min-w-0 max-w-[min(260px,calc(100vw-8rem))] truncate text-left">
          {triggerLabel}
        </span>
        <ChevronDown
          className="size-[13px] shrink-0 opacity-60"
          strokeWidth={2}
        />
      </PopoverTrigger>
      <PopoverContent
        align="end"
        sideOffset={4}
        className="w-auto max-w-[calc(100vw-1.5rem)] overflow-hidden rounded-xl p-0"
      >
        <div className="flex max-h-[min(90vh,640px)] flex-col overflow-hidden sm:max-h-none sm:flex-row">
          <div
            className={cn(
              "flex shrink-0 flex-col gap-px p-1",
              showCustomPanel &&
                "sm:w-[10.5rem] sm:border-r sm:border-border",
              !showCustomPanel && "w-full min-w-32 sm:w-36",
            )}
          >
            {presetRows}
            <button
              type="button"
              onClick={() => {
                setShowCustomPanel(true);
                seedCustomDrafts();
              }}
              className={cn(
                exportMenuRow,
                (preset === "custom" || showCustomPanel) &&
                  "bg-accent text-accent-foreground",
              )}
            >
              <span className="min-w-0 flex-1 truncate">{labels.custom}</span>
              <ChevronRight
                className="size-4 shrink-0 opacity-60"
                strokeWidth={2}
                aria-hidden
              />
            </button>
          </div>

          {showCustomPanel ? (
            <div className="flex min-w-0 flex-col gap-3 border-t border-border bg-popover p-3 sm:border-t-0 sm:border-l sm:border-border">
              <div className="flex flex-col gap-3 lg:flex-row">
                <div className="flex flex-col gap-1.5">
                  <span
                    className="text-[11px] font-semibold tracking-wide text-[var(--cazura-label)] uppercase"
                  >
                    From
                  </span>
                  <Calendar
                    mode="single"
                    selected={draftFrom}
                    onSelect={setDraftFrom}
                    className="w-fit rounded-xl [--cell-size:2.35rem] [--cell-radius:var(--radius-md)]"
                    classNames={cazuraCalendarClassNames}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <span
                    className="text-[11px] font-semibold tracking-wide text-[var(--cazura-label)] uppercase"
                  >
                    To
                  </span>
                  <Calendar
                    mode="single"
                    selected={draftTo}
                    onSelect={setDraftTo}
                    className="w-fit rounded-xl [--cell-size:2.35rem] [--cell-radius:var(--radius-md)]"
                    classNames={cazuraCalendarClassNames}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 border-t border-border pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="cursor-pointer text-xs"
                  onClick={() => setOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  size="sm"
                  disabled={!canApply}
                  className="cursor-pointer rounded-lg border px-3 text-xs font-medium shadow-[0_2px_8px_rgba(0,0,0,0.1)] disabled:cursor-not-allowed"
                  style={{
                    background: "var(--cazura-teal)",
                    borderColor: "#629298",
                    color: "var(--cazura-panel)",
                  }}
                  onClick={applyCustom}
                >
                  Apply
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      </PopoverContent>
    </Popover>
  );
}

export function TimeframeToolbar({
  preset,
  basePath,
  variant = "default",
  monthKey,
  custom,
}: {
  preset: TimePreset;
  basePath: string;
  variant?: "default" | "cazura";
  monthKey?: string;
  /** Active custom range (when `preset === "custom"`). Used for Cazura trigger label and calendars. */
  custom?: { from: Date; to: Date };
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const cazura = variant === "cazura";

  const monthOptions = useMemo(() => recentMonthKeys(new Date(), 12), []);

  function mergePush(mutate: (p: URLSearchParams) => void) {
    const p = new URLSearchParams(searchParams.toString());
    mutate(p);
    if (p.get("tf") !== "custom") {
      p.delete("from");
      p.delete("to");
    }
    const qs = p.toString();
    router.push(qs ? `${basePath}?${qs}` : basePath);
  }

  const triggerLabel =
    preset === "month" && monthKey
      ? formatMonthPickLabel(monthKey)
      : labels[preset];

  if (cazura) {
    return (
      <CazuraTimeframeMenu
        basePath={basePath}
        preset={preset}
        custom={custom}
      />
    );
  }

  return (
    <div className="inline-flex items-stretch">
      <DropdownMenu>
        <DropdownMenuTrigger
          className={cn(
            buttonVariants({ variant: "outline", size: "sm" }),
            "gap-2",
          )}
        >
          <CalendarRange className="size-4" />
          {triggerLabel}
          <ChevronDown className="size-3 opacity-60" strokeWidth={2} />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" sideOffset={6}>
          {(["today", "month", "year"] as const).map((p) => {
            const selected =
              p === "month"
                ? preset === "month" && !monthKey
                : preset === p;
            return (
              <DropdownMenuItem
                key={p}
                onClick={() => {
                  mergePush((params) => {
                    const q = timeQueryString(p);
                    for (const [k, v] of new URLSearchParams(q)) {
                      params.set(k, v);
                    }
                    params.delete("m");
                  });
                }}
                className={cn(selected && "bg-accent")}
              >
                {labels[p]}
              </DropdownMenuItem>
            );
          })}

          <DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-muted-foreground font-normal">
              Months
            </DropdownMenuLabel>
            {monthOptions.map(({ key, label }) => {
              const selected = preset === "month" && monthKey === key;
              return (
                <DropdownMenuItem
                  key={key}
                  onClick={() => {
                    mergePush((params) => {
                      const q = timeQueryString("month", undefined, {
                        monthKey: key,
                      });
                      for (const [k, v] of new URLSearchParams(q)) {
                        params.set(k, v);
                      }
                    });
                  }}
                  className={cn(selected && "bg-accent")}
                >
                  {label}
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuGroup>

          <DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-muted-foreground font-normal">
              Use toolbar &quot;Custom range&quot; button for dates
            </DropdownMenuLabel>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>

      <CustomRangePicker basePath={basePath} />
    </div>
  );
}
