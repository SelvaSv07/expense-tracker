"use client";

import { buttonVariants } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format, isValid } from "date-fns";
import { CalendarIcon, Clock } from "lucide-react";
import * as React from "react";

/** Local `datetime-local` string: `YYYY-MM-DDTHH:mm` */
export function toDatetimeLocalValue(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function parseDatetimeLocal(s: string): Date | undefined {
  if (!s.trim()) return undefined;
  const d = new Date(s);
  return isValid(d) ? d : undefined;
}

/** Calendar popover only; reads/writes the same datetime-local string as TimeField. */
export function DatePicker({
  id,
  value,
  onChange,
  onBlur,
  disabled,
  className,
}: {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  disabled?: boolean;
  className?: string;
}) {
  const [open, setOpen] = React.useState(false);

  const date = parseDatetimeLocal(value);
  const defaultMonth = date ?? new Date();

  const display = date ? format(date, "dd-MM-yyyy") : "Pick date";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        id={id}
        type="button"
        disabled={disabled}
        onBlur={onBlur}
        className={cn(
          buttonVariants({ variant: "outline", size: "default" }),
          "h-8 w-full min-w-0 cursor-pointer justify-start gap-2 border-input bg-transparent px-2.5 text-left font-normal shadow-none hover:bg-transparent dark:bg-input/30",
          "aria-expanded:bg-transparent aria-expanded:text-foreground dark:aria-expanded:bg-input/30",
          "aria-expanded:hover:bg-transparent dark:aria-expanded:hover:bg-input/30",
          !date && "text-muted-foreground",
          className,
        )}
      >
        <CalendarIcon className="size-4 shrink-0 text-muted-foreground" />
        <span className="truncate">{display}</span>
      </PopoverTrigger>
      <PopoverContent
        className="w-auto min-w-[17.5rem] max-w-[min(20rem,var(--available-width))] p-0"
        align="start"
        side="bottom"
        sideOffset={6}
      >
        <Calendar
          className="w-full min-w-0"
          mode="single"
          captionLayout="dropdown"
          selected={date}
          defaultMonth={defaultMonth}
          onSelect={(d) => {
            if (!d) return;
            const next = new Date(d);
            const cur = parseDatetimeLocal(value);
            if (cur) {
              next.setHours(cur.getHours(), cur.getMinutes(), 0, 0);
            } else {
              const now = new Date();
              next.setHours(now.getHours(), now.getMinutes(), 0, 0);
            }
            onChange(toDatetimeLocalValue(next));
            setOpen(false);
          }}
        />
      </PopoverContent>
    </Popover>
  );
}

/** Native time input; pairs with DatePicker on the same `value` string. */
export function TimeField({
  id,
  value,
  onChange,
  onBlur,
  disabled,
  className,
}: {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  disabled?: boolean;
  className?: string;
}) {
  const date = parseDatetimeLocal(value);
  const timeStr = date
    ? `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`
    : "00:00";

  return (
    <div className={cn("relative w-full", className)}>
      <Clock className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        id={id}
        type="time"
        step={60}
        value={timeStr}
        disabled={disabled}
        onBlur={onBlur}
        className="h-8 cursor-pointer pr-2 pl-9"
        onChange={(e) => {
          const v = e.target.value;
          if (!v) return;
          const [h, m] = v.split(":").map((x) => parseInt(x, 10));
          const base = parseDatetimeLocal(value) ?? new Date();
          base.setHours(h, m, 0, 0);
          onChange(toDatetimeLocalValue(base));
        }}
      />
    </div>
  );
}
