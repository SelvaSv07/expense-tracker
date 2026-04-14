import { db } from "@/db";
import { categories, userFinance } from "@/db/schema";
import { eq } from "drizzle-orm";

const DEFAULT_CATEGORIES: { name: string; type: "income" | "expense"; icon: string }[] =
  [
    { name: "Salary", type: "income", icon: "briefcase" },
    { name: "Freelance", type: "income", icon: "laptop" },
    { name: "Groceries", type: "expense", icon: "shopping-cart" },
    { name: "Dining", type: "expense", icon: "utensils" },
    { name: "Transport", type: "expense", icon: "car" },
    { name: "Utilities", type: "expense", icon: "zap" },
    { name: "Entertainment", type: "expense", icon: "film" },
    { name: "Savings", type: "expense", icon: "piggy-bank" },
    { name: "Healthcare", type: "expense", icon: "heart-pulse" },
    { name: "Shopping", type: "expense", icon: "shopping-bag" },
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
    })),
  );
}
