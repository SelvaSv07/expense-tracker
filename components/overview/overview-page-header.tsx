"use client";

import { TimeframeToolbar } from "@/components/dashboard/timeframe-toolbar";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { TimePreset } from "@/lib/time-range";
import { Download, Plus } from "lucide-react";
import Link from "next/link";

export function OverviewPageHeader({
  preset,
  basePath,
  monthKey,
  custom,
}: {
  preset: TimePreset;
  basePath: string;
  monthKey?: string;
  custom?: { from: Date; to: Date };
}) {
  return (
    <div className="flex flex-col gap-2.5 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0 flex-1">
        <p
          className="text-[22px] leading-tight font-bold tracking-tight"
          style={{ color: "var(--cazura-text)" }}
        >
          Overview
        </p>
        <p
          className="mt-1 text-[13px] font-medium"
          style={{ color: "var(--cazura-muted)" }}
        >
          Quick summary of your finances
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2.5">
        <TimeframeToolbar
          preset={preset}
          basePath={basePath}
          variant="cazura"
          monthKey={monthKey}
          custom={custom}
        />
        <Link
          href="/transactions"
          className={cn(
            buttonVariants({ variant: "outline", size: "sm" }),
            "h-8 gap-1.5 rounded-lg border px-3 text-xs font-medium shadow-none",
          )}
          style={{
            background: "var(--cazura-panel)",
            borderColor: "var(--cazura-border)",
            color: "var(--cazura-text)",
          }}
        >
          <Download className="size-3.5" strokeWidth={1.8} />
          Export
        </Link>
        <Link
          href="/settings"
          className={cn(
            buttonVariants({ size: "sm" }),
            "h-8 gap-1.5 rounded-lg border px-3 text-xs font-medium shadow-[0_2px_8px_rgba(0,0,0,0.1)]",
          )}
          style={{
            background: "var(--cazura-teal)",
            borderColor: "#629298",
            color: "var(--cazura-panel)",
          }}
        >
          <Plus className="size-3.5" strokeWidth={2.5} />
          Categories
        </Link>
      </div>
    </div>
  );
}
