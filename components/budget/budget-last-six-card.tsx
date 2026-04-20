"use client";

import { loadBudgetRadarSeries } from "@/actions/budgets";
import { BudgetRadarChart } from "@/components/charts/budget-radar-chart";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { BUDGET_CLIENT_MONTH_CHANGED } from "@/lib/budget-client-sync";
import { cn } from "@/lib/utils";
import {
  RADAR_WINDOW_MONTHS,
  type RadarWindowMonths,
} from "@/lib/search-params-time";
import { usePathname } from "next/navigation";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useTransition,
} from "react";

function monthKeyFromLocation(): string | null {
  const m = new URLSearchParams(window.location.search).get("m");
  return m && /^\d{4}-\d{2}$/.test(m) ? m : null;
}

export function BudgetLastSixCard({
  data: initialData,
  monthCount: initialMonthCount,
  anchorMonthKey: anchorMonthKeyProp,
}: {
  data: { month: string; pct: number }[];
  monthCount: RadarWindowMonths;
  /** Calendar month the rolling window ends on (`YYYY-MM`). */
  anchorMonthKey: string;
}) {
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const [chartData, setChartData] = useState(initialData);
  const [monthCount, setMonthCount] = useState(initialMonthCount);
  const [anchorMonthKey, setAnchorMonthKey] = useState(anchorMonthKeyProp);
  const monthCountRef = useRef(monthCount);

  useEffect(() => {
    monthCountRef.current = monthCount;
  }, [monthCount]);

  useEffect(() => {
    setChartData(initialData);
    setMonthCount(initialMonthCount);
    setAnchorMonthKey(anchorMonthKeyProp);
  }, [initialData, initialMonthCount, anchorMonthKeyProp]);

  const replaceRadarInUrl = useCallback(
    (next: RadarWindowMonths) => {
      const p = new URLSearchParams(
        typeof window !== "undefined" ? window.location.search : "",
      );
      p.set("radarMonths", String(next));
      window.history.replaceState(
        null,
        "",
        `${pathname}?${p.toString()}`,
      );
    },
    [pathname],
  );

  const fetchRadar = useCallback(
    (anchor: string, months: RadarWindowMonths) => {
      startTransition(async () => {
        try {
          const { data } = await loadBudgetRadarSeries({
            anchorMonthKey: anchor,
            months,
          });
          setChartData(data);
          setAnchorMonthKey(anchor);
        } catch (e) {
          console.error(e);
        }
      });
    },
    [],
  );

  const applyRadarMonths = useCallback(
    (next: RadarWindowMonths) => {
      const anchor = monthKeyFromLocation() ?? anchorMonthKey;
      startTransition(async () => {
        try {
          const { data } = await loadBudgetRadarSeries({
            anchorMonthKey: anchor,
            months: next,
          });
          setChartData(data);
          setMonthCount(next);
          setAnchorMonthKey(anchor);
          replaceRadarInUrl(next);
        } catch (e) {
          console.error(e);
        }
      });
    },
    [anchorMonthKey, replaceRadarInUrl],
  );

  useEffect(() => {
    const onMonthChanged = (ev: Event) => {
      const detail = (ev as CustomEvent<{ monthKey?: string }>).detail;
      if (!detail?.monthKey) return;
      fetchRadar(detail.monthKey, monthCountRef.current);
    };
    window.addEventListener(BUDGET_CLIENT_MONTH_CHANGED, onMonthChanged);
    return () =>
      window.removeEventListener(BUDGET_CLIENT_MONTH_CHANGED, onMonthChanged);
  }, [fetchRadar]);

  return (
    <div
      className="overflow-hidden rounded-xl border"
      style={{
        background: "var(--cazura-panel)",
        borderColor: "var(--cazura-border)",
      }}
    >
      <div className="flex flex-col gap-1 p-3 pb-2">
        <div className="flex items-start gap-3">
          <div className="flex min-w-0 flex-1 flex-col gap-0.5 pr-1">
            <span
              className="text-[13px] font-semibold"
              style={{ color: "var(--cazura-text)" }}
            >
              Budget use by month
            </span>
            <span
              className="text-[11px] leading-snug"
              style={{ color: "var(--cazura-muted)" }}
            >
              Share of your budget used in each month (categories you budget
              for). Months at 0% sit at the center.
            </span>
          </div>
          <Select
            value={String(monthCount)}
            disabled={isPending}
            onValueChange={(v) => {
              const n = Number(v);
              if (n === 3 || n === 6 || n === 9 || n === 12) {
                applyRadarMonths(n);
              }
            }}
          >
            <SelectTrigger
              size="sm"
              className="h-auto min-h-0 w-auto shrink-0 cursor-pointer border-0 bg-transparent py-0 pr-1 pl-0 text-sm font-bold whitespace-nowrap shadow-none hover:opacity-90 data-[size=sm]:h-auto focus-visible:ring-0 disabled:opacity-50 [&_svg]:ml-0.5 [&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:text-[var(--cazura-muted)]"
              style={{ color: "var(--cazura-text)" }}
            >
              <span className="truncate">Last {monthCount} Months</span>
            </SelectTrigger>
            <SelectContent
              align="end"
              className="min-w-[10.5rem] border-[var(--cazura-border)] bg-[var(--cazura-panel)] text-[var(--cazura-text)] ring-[var(--cazura-border)]"
            >
              {RADAR_WINDOW_MONTHS.map((n) => (
                <SelectItem
                  key={n}
                  value={String(n)}
                  className="cursor-pointer focus:bg-[var(--cazura-canvas)] focus:text-[var(--cazura-text)]"
                >
                  Last {n} Months
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div
        className={cn(
          "px-3 pb-3 transition-opacity",
          isPending && "opacity-60",
        )}
        aria-busy={isPending}
      >
        <BudgetRadarChart data={chartData} variant="cazura" />
      </div>
    </div>
  );
}
