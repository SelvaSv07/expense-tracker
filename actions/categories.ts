"use server";

import { db } from "@/db";
import { budgets, categories, transactions } from "@/db/schema";
import { categoryColorSchema } from "@/lib/category-color";
import { CATEGORY_ICON_OPTIONS } from "@/lib/category-icon";
import { getSession } from "@/lib/session";
import { and, count, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const iconSchema = z.enum(
  CATEGORY_ICON_OPTIONS as unknown as [string, ...string[]],
);

const createSchema = z.object({
  name: z.string().min(1, "Name is required").max(80),
  type: z.enum(["income", "expense"]),
  icon: iconSchema,
  color: categoryColorSchema,
});

const updateSchema = createSchema.extend({
  categoryId: z.string().min(1),
});

export async function createCategory(input: z.infer<typeof createSchema>) {
  const parsed = createSchema.parse(input);
  const session = await getSession();
  if (!session?.user?.id) throw new Error("Unauthorized");

  await db.insert(categories).values({
    id: crypto.randomUUID(),
    userId: session.user.id,
    name: parsed.name.trim(),
    type: parsed.type,
    icon: parsed.icon,
    color: parsed.color,
  });

  revalidatePath("/settings");
  revalidatePath("/settings/categories");
  revalidatePath("/transactions");
  revalidatePath("/budget");
  revalidatePath("/overview");
}

export async function updateCategory(input: z.infer<typeof updateSchema>) {
  const parsed = updateSchema.parse(input);
  const session = await getSession();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const [cat] = await db
    .select()
    .from(categories)
    .where(
      and(
        eq(categories.id, parsed.categoryId),
        eq(categories.userId, session.user.id),
      ),
    )
    .limit(1);
  if (!cat) throw new Error("Category not found");

  if (parsed.type !== cat.type) {
    const [txAgg] = await db
      .select({ n: count() })
      .from(transactions)
      .where(eq(transactions.categoryId, parsed.categoryId));
    const [budAgg] = await db
      .select({ n: count() })
      .from(budgets)
      .where(
        and(
          eq(budgets.categoryId, parsed.categoryId),
          eq(budgets.userId, session.user.id),
        ),
      );
    const txCount = Number(txAgg?.n ?? 0);
    const budCount = Number(budAgg?.n ?? 0);
    if (txCount > 0 || budCount > 0) {
      throw new Error(
        "Cannot change income/expense type while this category has transactions or budget entries.",
      );
    }
  }

  await db
    .update(categories)
    .set({
      name: parsed.name.trim(),
      type: parsed.type,
      icon: parsed.icon,
      color: parsed.color,
    })
    .where(eq(categories.id, parsed.categoryId));

  revalidatePath("/settings");
  revalidatePath("/settings/categories");
  revalidatePath("/transactions");
  revalidatePath("/budget");
  revalidatePath("/overview");
}

export async function deleteCategory(categoryId: string) {
  const session = await getSession();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const [cat] = await db
    .select()
    .from(categories)
    .where(
      and(eq(categories.id, categoryId), eq(categories.userId, session.user.id)),
    )
    .limit(1);
  if (!cat) throw new Error("Category not found");

  const [tx] = await db
    .select({ id: transactions.id })
    .from(transactions)
    .where(eq(transactions.categoryId, categoryId))
    .limit(1);
  if (tx) {
    throw new Error(
      "This category is used in one or more transactions. Reassign or delete those first.",
    );
  }

  const [bud] = await db
    .select({ id: budgets.id })
    .from(budgets)
    .where(
      and(
        eq(budgets.categoryId, categoryId),
        eq(budgets.userId, session.user.id),
      ),
    )
    .limit(1);
  if (bud) {
    throw new Error(
      "This category has budget entries. Remove those budgets before deleting the category.",
    );
  }

  await db.delete(categories).where(eq(categories.id, categoryId));

  revalidatePath("/settings");
  revalidatePath("/settings/categories");
  revalidatePath("/transactions");
  revalidatePath("/budget");
  revalidatePath("/overview");
}
