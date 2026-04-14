"use client";

import { buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { timeQueryString } from "@/lib/search-params-time";
import type { TimePreset } from "@/lib/time-range";
import { cn } from "@/lib/utils";
import { ChevronDown, Download } from "lucide-react";

export function ExportMenu({
  preset,
  custom,
  monthKey,
  variant = "default",
}: {
  preset: TimePreset;
  custom?: { from: Date; to: Date };
  monthKey?: string;
  variant?: "default" | "cazura";
}) {
  const cazura = variant === "cazura";
  const q = timeQueryString(preset, custom, { monthKey });
  const base = `/api/export/transactions?${q}`;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          buttonVariants({ variant: "outline", size: "sm" }),
          cazura
            ? "h-8 gap-1.5 rounded-lg border px-3 text-xs font-medium shadow-none"
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
        <Download
          className={cazura ? "size-3.5" : "size-4"}
          strokeWidth={cazura ? 1.8 : 2}
        />
        Export
        <ChevronDown
          className={cn("size-3 opacity-60", cazura && "size-[13px]")}
          strokeWidth={2}
        />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onClick={() => {
            window.location.href = `${base}&format=pdf`;
          }}
        >
          PDF
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => {
            window.location.href = `${base}&format=excel`;
          }}
        >
          Excel
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
