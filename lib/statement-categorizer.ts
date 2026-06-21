/**
 * Heuristic auto-categorizer for imported statement transactions.
 *
 * Each user category may declare a comma-separated `keywords` list (managed
 * via Settings → Categories). When importing a bank statement we try to match
 * the narration / description of each row against every category's keywords
 * (and the category name itself) and assign the best match.
 *
 * Matching is case-insensitive substring; longer / more specific keyword hits
 * win, so "amazon prime" beats "amazon".
 */

import type { ParsedTransaction } from "@/lib/statement-parser";

export type CategoryCandidate = {
  id: string;
  name: string;
  type: string;
  keywords: string[] | null;
};

/**
 * @param text  Narration / description text from the statement row.
 * @param direction  "expense" or "income"; only same-type categories are returned.
 */
export function suggestCategoryForText(
  text: string,
  direction: "expense" | "income",
  categories: CategoryCandidate[],
): CategoryCandidate | null {
  const haystack = text.toLowerCase();
  if (!haystack.trim()) return null;

  let best: { category: CategoryCandidate; score: number } | null = null;

  for (const cat of categories) {
    if (cat.type !== direction) continue;
    const tokens: string[] = [];
    if (cat.keywords && cat.keywords.length > 0) tokens.push(...cat.keywords);
    if (cat.name) tokens.push(cat.name);
    for (const raw of tokens) {
      const token = raw.trim().toLowerCase();
      if (!token) continue;
      if (haystack.includes(token)) {
        const score = token.length;
        if (!best || score > best.score) {
          best = { category: cat, score };
        }
      }
    }
  }
  return best?.category ?? null;
}

/** Add a `suggestedCategoryId` to every parsed transaction. */
export function annotateWithSuggestedCategories(
  rows: ParsedTransaction[],
  categories: CategoryCandidate[],
): Array<ParsedTransaction & { suggestedCategoryId: string | null }> {
  return rows.map((r) => ({
    ...r,
    suggestedCategoryId: suggestCategoryForText(
      r.description,
      r.direction,
      categories,
    )?.id ?? null,
  }));
}

/** Parse a category's stored `keywords` column into a normalized list. */
export function parseKeywords(raw: string | null | undefined): string[] {
  if (!raw) return [];
  return raw
    .split(/[,\n]/g)
    .map((k) => k.trim())
    .filter(Boolean);
}