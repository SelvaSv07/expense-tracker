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
    const displayName = hasTitle ? transactionName!.trim() : name;

    const labelBody = (
      <>
        <CategoryIconShelf
          icon={icon}
          color={color}
          className="size-[26px] shrink-0 border p-1"
          style={categoryIconShelfBorderStyle(color)}
          iconClassName="size-3"
        />
        <span
          className="min-w-0 truncate text-sm font-medium"
          style={{ color: "var(--cazura-text)" }}
        >
          {displayName}
        </span>
      </>
    );

    if (hasTitle) {
      return (
        <Tooltip>
          <TooltipTrigger
            type="button"
            className={cn(
              "inline-flex w-fit max-w-full cursor-default items-center gap-1.5 rounded-md border-0 bg-transparent p-0 text-left outline-none",
              "focus-visible:ring-2 focus-visible:ring-[var(--cazura-teal)]/35 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--cazura-panel)]",
            )}
            aria-label={`${displayName}, category: ${name}`}
            onClick={(e) => e.stopPropagation()}
          >
            {labelBody}
          </TooltipTrigger>
          <TooltipContent side="top" sideOffset={6} align="start">
            {name}
          </TooltipContent>
        </Tooltip>
      );
    }

    return (
      <div className="flex min-w-0 w-full items-center gap-1.5">{labelBody}</div>
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
