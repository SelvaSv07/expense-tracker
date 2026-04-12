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
}: {
  preset: TimePreset;
  custom?: { from: Date; to: Date };
}) {
  const q = timeQueryString(preset, custom);
  const base = `/api/export/transactions?${q}`;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          buttonVariants({ variant: "outline", size: "sm" }),
          "gap-2",
        )}
      >
        <Download className="size-4" />
        Export
        <ChevronDown className="size-3 opacity-60" />
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
