"use client";

import { CustomRangePickerInner } from "@/components/dashboard/custom-range-picker";
import { buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { timeQueryString } from "@/lib/search-params-time";
import type { TimePreset } from "@/lib/time-range";
import { cn } from "@/lib/utils";
import { CalendarDays, CalendarRange, ChevronDown } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useRef, useState } from "react";
import { startOfMonth, subMonths } from "date-fns";

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

export function TimeframeToolbar({
  preset,
  basePath,
  variant = "default",
  monthKey,
}: {
  preset: TimePreset;
  basePath: string;
  variant?: "default" | "cazura";
  monthKey?: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const cazura = variant === "cazura";
  const anchorRef = useRef<HTMLDivElement>(null);
  const [rangeOpen, setRangeOpen] = useState(false);

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

  return (
    <div
      ref={anchorRef}
      className={cn(cazura && "relative inline-flex items-stretch")}
    >
      {cazura ? (
        <CustomRangePickerInner
          basePath={basePath}
          open={rangeOpen}
          onOpenChange={setRangeOpen}
          anchor={anchorRef}
          hideTrigger
        />
      ) : null}

      <DropdownMenu
        onOpenChange={(menuOpen) => {
          if (menuOpen) setRangeOpen(false);
        }}
      >
        <DropdownMenuTrigger
          className={cn(
            buttonVariants({ variant: "outline", size: "sm" }),
            cazura
              ? "relative z-20 h-8 gap-1.5 rounded-lg border px-3 text-xs font-medium shadow-none"
              : "gap-2",
          )}
          style={
            cazura
              ? {
                  background: "var(--cazura-panel)",
                  borderColor: "var(--cazura-border)",
                  color: "var(--cazura-text)",
                }
              : undefined
          }
        >
          {cazura ? (
            <CalendarDays className="size-3.5" strokeWidth={1.8} />
          ) : (
            <CalendarRange className="size-4" />
          )}
          {triggerLabel}
          <ChevronDown className="size-3 opacity-60" strokeWidth={2} />
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="start"
          sideOffset={6}
          className={cn(
            cazura &&
              "max-h-[min(420px,70vh)] overflow-y-auto rounded-xl border border-[var(--cazura-border)] bg-[var(--cazura-panel)] p-2 shadow-[0_4px_24px_rgba(0,0,0,0.08)] ring-0",
          )}
        >
          {(["today", "month", "year"] as const).map((p) => {
            const selected =
              p === "month"
                ? preset === "month" && !monthKey
                : preset === p;
            return (
              <DropdownMenuItem
                key={p}
                onClick={() => {
                  setRangeOpen(false);
                  mergePush((params) => {
                    const q = timeQueryString(p);
                    for (const [k, v] of new URLSearchParams(q)) {
                      params.set(k, v);
                    }
                    params.delete("m");
                  });
                }}
                className={cn(
                  cazura &&
                    "cursor-pointer rounded-lg px-2.5 py-2.5 text-[13px] font-medium text-[var(--cazura-text)] hover:bg-[#f0f0f0] focus:bg-[#f0f0f0] focus:text-[var(--cazura-text)]",
                  cazura &&
                    selected &&
                    "bg-[#ecf4ec] text-[var(--cazura-teal)] hover:bg-[#e0ebe0] focus:bg-[#e0ebe0]",
                )}
              >
                {labels[p]}
              </DropdownMenuItem>
            );
          })}

          <DropdownMenuGroup>
            <DropdownMenuSeparator
              className={cn(cazura && "bg-[var(--cazura-border)]")}
            />
            <DropdownMenuLabel
              className={cn(
                cazura
                  ? "px-2.5 py-1.5 text-[11px] font-semibold tracking-wide text-[var(--cazura-label)] uppercase"
                  : "text-muted-foreground font-normal",
              )}
            >
              Months
            </DropdownMenuLabel>
            {monthOptions.map(({ key, label }) => {
              const selected = preset === "month" && monthKey === key;
              return (
                <DropdownMenuItem
                  key={key}
                  onClick={() => {
                    setRangeOpen(false);
                    mergePush((params) => {
                      const q = timeQueryString("month", undefined, {
                        monthKey: key,
                      });
                      for (const [k, v] of new URLSearchParams(q)) {
                        params.set(k, v);
                      }
                    });
                  }}
                  className={cn(
                    cazura &&
                      "cursor-pointer rounded-lg px-2.5 py-2.5 text-[13px] font-medium text-[var(--cazura-text)] hover:bg-[#f0f0f0] focus:bg-[#f0f0f0] focus:text-[var(--cazura-text)]",
                    cazura &&
                      selected &&
                      "bg-[#ecf4ec] text-[var(--cazura-teal)] hover:bg-[#e0ebe0] focus:bg-[#e0ebe0]",
                  )}
                >
                  {label}
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuGroup>

          {cazura ? (
            <DropdownMenuItem
              onClick={() => {
                setRangeOpen(true);
              }}
              className={cn(
                "cursor-pointer rounded-lg px-2.5 py-2.5 text-[13px] font-medium text-[var(--cazura-text)] hover:bg-[#f0f0f0] focus:bg-[#f0f0f0] focus:text-[var(--cazura-text)]",
                preset === "custom" &&
                  "bg-[#ecf4ec] text-[var(--cazura-teal)] hover:bg-[#e0ebe0] focus:bg-[#e0ebe0]",
              )}
            >
              {labels.custom}
            </DropdownMenuItem>
          ) : (
            <DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuLabel className="text-muted-foreground font-normal">
                Use toolbar &quot;Custom range&quot; button for dates
              </DropdownMenuLabel>
            </DropdownMenuGroup>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
