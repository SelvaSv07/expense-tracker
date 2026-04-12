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
import { CalendarRange, ChevronDown } from "lucide-react";
import { useRouter } from "next/navigation";

const labels: Record<TimePreset, string> = {
  today: "Today",
  month: "This Month",
  year: "This Year",
  custom: "Custom range",
};

export function TimeframeToolbar({
  preset,
  basePath,
}: {
  preset: TimePreset;
  basePath: string;
}) {
  const router = useRouter();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          buttonVariants({ variant: "outline", size: "sm" }),
          "gap-2",
        )}
      >
        <CalendarRange className="size-4" />
        {labels[preset]}
        <ChevronDown className="size-3 opacity-60" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        {(["today", "month", "year"] as const).map((p) => (
          <DropdownMenuItem
            key={p}
            onClick={() =>
              router.push(`${basePath}?${timeQueryString(p)}`)
            }
          >
            {labels[p]}
          </DropdownMenuItem>
        ))}
        <DropdownMenuItem
          onClick={() =>
            router.push(`${basePath}?${timeQueryString("month")}`)
          }
        >
          Use toolbar &quot;Custom range&quot; button for dates
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
