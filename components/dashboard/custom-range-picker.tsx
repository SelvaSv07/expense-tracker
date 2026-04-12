"use client";

import { Button, buttonVariants } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { timeQueryString } from "@/lib/search-params-time";
import { cn } from "@/lib/utils";
import { CalendarIcon } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import type { DateRange } from "react-day-picker";

export function CustomRangePicker({ basePath }: { basePath: string }) {
  const [open, setOpen] = useState(false);
  const [range, setRange] = useState<DateRange | undefined>();

  const href =
    range?.from && range?.to
      ? `${basePath}?${timeQueryString("custom", {
          from: range.from,
          to: range.to,
        })}`
      : "#";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        className={cn(
          buttonVariants({ variant: "outline", size: "sm" }),
          "gap-2",
        )}
      >
        <CalendarIcon className="size-4" />
        Custom range
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="range"
          numberOfMonths={2}
          selected={range}
          onSelect={setRange}
        />
        <div className="flex justify-end gap-2 border-t p-2">
          <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Link
            href={href}
            onClick={() => setOpen(false)}
            className={cn(
              buttonVariants({ size: "sm" }),
              (!range?.from || !range?.to) && "pointer-events-none opacity-50",
            )}
            aria-disabled={!range?.from || !range?.to}
          >
            Apply
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  );
}
