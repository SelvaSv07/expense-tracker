import { db } from "@/db";
import { categories, wallets } from "@/db/schema";
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

export async function ensureUserBootstrap(userId: string) {
  const existing = await db
    .select({ id: wallets.id })
    .from(wallets)
    .where(eq(wallets.userId, userId))
    .limit(1);

  if (existing.length > 0) return;

  const walletId = crypto.randomUUID();
  await db.insert(wallets).values({
    id: walletId,
    userId,
    name: "Main Wallet",
    currency: "INR",
    openingBalance: 0,
    isDefault: true,
  });

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
