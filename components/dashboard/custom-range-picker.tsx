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
import { useSearchParams } from "next/navigation";
import { useMemo, useState, type RefObject } from "react";
import type { DateRange } from "react-day-picker";

function CustomRangePopoverBody({
  basePath,
  range,
  setRange,
  onRequestClose,
}: {
  basePath: string;
  range: DateRange | undefined;
  setRange: (r: DateRange | undefined) => void;
  onRequestClose: () => void;
}) {
  const searchParams = useSearchParams();
  const href = useMemo(() => {
    if (!range?.from || !range?.to) return "#";
    const p = new URLSearchParams(searchParams.toString());
    const q = new URLSearchParams(
      timeQueryString("custom", {
        from: range.from,
        to: range.to,
      }),
    );
    for (const [k, v] of q) p.set(k, v);
    p.delete("m");
    const qs = p.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  }, [basePath, range?.from, range?.to, searchParams]);

  return (
    <>
      <Calendar
        mode="range"
        numberOfMonths={2}
        selected={range}
        onSelect={setRange}
      />
      <div className="flex justify-end gap-2 border-t p-2">
        <Button variant="ghost" size="sm" onClick={() => onRequestClose()}>
          Cancel
        </Button>
        <Link
          href={href}
          onClick={() => onRequestClose()}
          className={cn(
            buttonVariants({ size: "sm" }),
            (!range?.from || !range?.to) && "pointer-events-none opacity-50",
          )}
          aria-disabled={!range?.from || !range?.to}
        >
          Apply
        </Link>
      </div>
    </>
  );
}

export function CustomRangePickerInner({
  basePath,
  open,
  onOpenChange,
  anchor,
  hideTrigger,
}: {
  basePath: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  anchor?: RefObject<Element | null>;
  hideTrigger: boolean;
}) {
  const [range, setRange] = useState<DateRange | undefined>();

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      {!hideTrigger ? (
        <PopoverTrigger
          className={cn(
            buttonVariants({ variant: "outline", size: "sm" }),
            "gap-2",
          )}
        >
          <CalendarIcon className="size-4" />
          Custom range
        </PopoverTrigger>
      ) : null}
      <PopoverContent
        className="w-auto p-0"
        align="start"
        side="bottom"
        sideOffset={6}
        anchor={anchor}
      >
        <CustomRangePopoverBody
          basePath={basePath}
          range={range}
          setRange={setRange}
          onRequestClose={() => onOpenChange(false)}
        />
      </PopoverContent>
    </Popover>
  );
}

export function CustomRangePicker({ basePath }: { basePath: string }) {
  const [open, setOpen] = useState(false);

  return (
    <CustomRangePickerInner
      basePath={basePath}
      open={open}
      onOpenChange={setOpen}
      hideTrigger={false}
    />
  );
}
