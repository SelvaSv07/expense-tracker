import { CategoryIcon } from "@/lib/category-icon";
import { cn } from "@/lib/utils";
import type { CSSProperties } from "react";
import { z } from "zod";

/** Curated palette for new categories (hex, no alpha). */
export const CATEGORY_COLOR_OPTIONS = [
  "#22c55e",
  "#14b8a6",
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
  "#ef4444",
  "#f97316",
  "#f59e0b",
  "#84cc16",
  "#06b6d4",
  "#6366f1",
  "#64748b",
] as const;

export type CategoryColorHex = (typeof CATEGORY_COLOR_OPTIONS)[number];

export const categoryColorSchema = z.enum(
  CATEGORY_COLOR_OPTIONS as unknown as [string, ...string[]],
);

export const DEFAULT_CATEGORY_COLOR: CategoryColorHex = "#64748b";

const HEX6 = /^#[0-9A-Fa-f]{6}$/;

export function normalizeCategoryColor(value: string | null | undefined): string {
  if (value && HEX6.test(value)) return value;
  return DEFAULT_CATEGORY_COLOR;
}

export function categoryIconShelfStyle(hex: string): CSSProperties {
  const c = normalizeCategoryColor(hex);
  return {
    backgroundColor: `color-mix(in srgb, ${c} 18%, transparent)`,
    color: c,
  };
}

export function CategoryIconShelf({
  icon,
  color,
  className,
  iconClassName,
  style,
}: {
  icon: string | null;
  color: string | null | undefined;
  className?: string;
  iconClassName?: string;
  style?: CSSProperties;
}) {
  const c = normalizeCategoryColor(color);
  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-lg",
        className,
      )}
      style={{ ...categoryIconShelfStyle(c), ...style }}
    >
      <CategoryIcon
        name={icon}
        className={cn("shrink-0", iconClassName)}
      />
    </div>
  );
}
