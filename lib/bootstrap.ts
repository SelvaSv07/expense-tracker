import { db } from "@/db";
import { categories, userFinance } from "@/db/schema";
import type { CategoryColorHex } from "@/lib/category-color";
import { eq } from "drizzle-orm";

const DEFAULT_CATEGORIES: {
  name: string;
  type: "income" | "expense";
  icon: string;
  color: CategoryColorHex;
}[] = [
  { name: "Salary", type: "income", icon: "briefcase", color: "#22c55e" },
  { name: "Freelance", type: "income", icon: "laptop", color: "#14b8a6" },
  { name: "Groceries", type: "expense", icon: "shopping-cart", color: "#ec4899" },
  { name: "Dining", type: "expense", icon: "utensils", color: "#f97316" },
  { name: "Transport", type: "expense", icon: "car", color: "#ef4444" },
  { name: "Utilities", type: "expense", icon: "zap", color: "#f59e0b" },
  { name: "Entertainment", type: "expense", icon: "film", color: "#8b5cf6" },
  { name: "Savings", type: "expense", icon: "piggy-bank", color: "#6366f1" },
  { name: "Healthcare", type: "expense", icon: "heart-pulse", color: "#06b6d4" },
  { name: "Shopping", type: "expense", icon: "shopping-bag", color: "#84cc16" },
];

async function ensureUserFinanceRow(userId: string) {
  const [existing] = await db
    .select({ userId: userFinance.userId })
    .from(userFinance)
    .where(eq(userFinance.userId, userId))
    .limit(1);
  if (existing) return;
  await db.insert(userFinance).values({
    userId,
    openingBalance: 0,
  });
}

export async function ensureUserBootstrap(userId: string) {
  const existing = await db
    .select({ id: categories.id })
    .from(categories)
    .where(eq(categories.userId, userId))
    .limit(1);

  if (existing.length > 0) {
    await ensureUserFinanceRow(userId);
    return;
  }

  await ensureUserFinanceRow(userId);

  await db.insert(categories).values(
    DEFAULT_CATEGORIES.map((c) => ({
      id: crypto.randomUUID(),
      userId,
      name: c.name,
      type: c.type,
      icon: c.icon,
      color: c.color,
    })),
  );
}
