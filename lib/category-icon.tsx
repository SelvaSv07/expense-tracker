import * as Lucide from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { createElement } from "react";

/** Curated icon names stored as kebab-case (matches Lucide file names). */
export const CATEGORY_ICON_OPTIONS = [
  "briefcase",
  "laptop",
  "shopping-cart",
  "utensils",
  "car",
  "zap",
  "film",
  "piggy-bank",
  "heart-pulse",
  "shopping-bag",
  "home",
  "plane",
  "train",
  "bike",
  "coffee",
  "gift",
  "book",
  "gamepad-2",
  "music",
  "camera",
  "phone",
  "wifi",
  "shield",
  "graduation-cap",
  "stethoscope",
  "baby",
  "dog",
  "dumbbell",
  "shirt",
  "wrench",
  "tag",
  "wallet",
  "landmark",
  "coins",
  "receipt",
  "package",
  "sparkles",
] as const;

export type CategoryIconName = (typeof CATEGORY_ICON_OPTIONS)[number];

function kebabToPascal(s: string): string {
  return s
    .split("-")
    .filter(Boolean)
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase())
    .join("");
}

export function resolveCategoryIcon(
  name: string | null | undefined,
): LucideIcon {
  if (!name) return Lucide.Tag;
  const key = kebabToPascal(name) as keyof typeof Lucide;
  const C = Lucide[key];
  if (typeof C === "function" || (typeof C === "object" && C !== null)) {
    return C as LucideIcon;
  }
  return Lucide.Tag;
}

export function CategoryIcon({
  name,
  className,
}: {
  name: string | null | undefined;
  className?: string;
}) {
  return createElement(resolveCategoryIcon(name), { className });
}
