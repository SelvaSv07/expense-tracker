"use client";

import {
  CategoryIconShelf,
  categoryIconShelfBorderStyle,
} from "@/lib/category-color";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

function chipClass() {
  return "max-w-full rounded border px-1 py-0.5 text-[10px] font-medium break-words whitespace-normal";
}

export function TransactionCategoryLabel({
  name,
  icon,
  color,
  transactionName,
  note,
  variant = "default",
}: {
  name: string;
  icon: string | null;
  color?: string | null;
  transactionName?: string | null;
  note?: string | null;
  /** `cazura` matches the transactions table: icon tile, name + optional tag chips. */
  variant?: "default" | "cazura";
}) {
  const hasTitle = Boolean(transactionName?.trim());
  const hasNote = Boolean(note?.trim());
  const hasExtra = hasTitle || hasNote;

  if (variant === "cazura") {
    return (
      <div className="flex min-w-0 w-full flex-wrap items-center gap-x-1.5 gap-y-1">
        <Tooltip>
          <TooltipTrigger
            type="button"
            className={cn(
              "inline-flex cursor-default rounded-md border-0 bg-transparent p-0 outline-none",
              "focus-visible:ring-2 focus-visible:ring-[var(--cazura-teal)]/35 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--cazura-panel)]",
            )}
            aria-label={`Category: ${name}`}
            onClick={(e) => e.stopPropagation()}
          >
            <CategoryIconShelf
              icon={icon}
              color={color}
              className="size-[26px] shrink-0 border p-1"
              style={categoryIconShelfBorderStyle(color)}
              iconClassName="size-3"
            />
          </TooltipTrigger>
          <TooltipContent side="top" sideOffset={6}>
            {name}
          </TooltipContent>
        </Tooltip>
        <span
          className="min-w-0 max-w-full text-sm font-medium break-words"
          style={{ color: "var(--cazura-text)" }}
        >
          {name}
        </span>
        {hasTitle ? (
          <span
            className={chipClass()}
            style={{
              background: "var(--cazura-canvas)",
              borderColor: "var(--cazura-border)",
              color: "var(--cazura-text)",
            }}
            title={transactionName ?? undefined}
          >
            {transactionName}
          </span>
        ) : null}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex gap-2.5",
        hasExtra ? "items-start" : "items-center",
      )}
    >
      <CategoryIconShelf
        icon={icon}
        color={color}
        title={name}
        className={cn("size-8", hasExtra && "mt-0.5")}
        iconClassName="size-4"
      />
      <div className="min-w-0">
        <span className="font-medium">{name}</span>
        {hasTitle ? (
          <span className="text-muted-foreground mt-0.5 block text-xs">
            {transactionName}
          </span>
        ) : null}
        {hasNote ? (
          <span className="text-muted-foreground mt-0.5 block text-xs">
            {note}
          </span>
        ) : null}
      </div>
    </div>
  );
}
