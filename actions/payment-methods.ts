"use server";

import { db } from "@/db";
import { paymentMethods, transactions } from "@/db/schema";
import { listPaymentMethods } from "@/lib/queries";
import { getSession } from "@/lib/session";
import { and, count, eq, max } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const nameSchema = z.object({
  name: z.string().min(1, "Name is required").max(80),
});

const updateSchema = nameSchema.extend({
  paymentMethodId: z.string().min(1),
});

function revalidatePaymentMethodPaths() {
  revalidatePath("/settings");
  revalidatePath("/settings/payment-methods");
  revalidatePath("/transactions");
  revalidatePath("/overview");
}

export async function createPaymentMethod(input: z.infer<typeof nameSchema>) {
  const parsed = nameSchema.parse(input);
  const session = await getSession();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const name = parsed.name.trim();
  await listPaymentMethods(session.user.id);

  const [agg] = await db
    .select({ mx: max(paymentMethods.sortOrder) })
    .from(paymentMethods)
    .where(eq(paymentMethods.userId, session.user.id));

  const nextOrder = (agg?.mx ?? -1) + 1;

  await db.insert(paymentMethods).values({
    id: crypto.randomUUID(),
    userId: session.user.id,
    name,
    sortOrder: nextOrder,
  });

  revalidatePaymentMethodPaths();
}

export async function updatePaymentMethod(
  input: z.infer<typeof updateSchema>,
) {
  const parsed = updateSchema.parse(input);
  const session = await getSession();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const newName = parsed.name.trim();

  const [row] = await db
    .select()
    .from(paymentMethods)
    .where(
      and(
        eq(paymentMethods.id, parsed.paymentMethodId),
        eq(paymentMethods.userId, session.user.id),
      ),
    )
    .limit(1);
  if (!row) throw new Error("Payment method not found");

  if (newName === row.name) {
    revalidatePaymentMethodPaths();
    return;
  }

  const [conflict] = await db
    .select({ id: paymentMethods.id })
    .from(paymentMethods)
    .where(
      and(
        eq(paymentMethods.userId, session.user.id),
        eq(paymentMethods.name, newName),
      ),
    )
    .limit(1);
  if (conflict) throw new Error("A payment method with this name already exists.");

  const oldName = row.name;

  await db.transaction(async (tx) => {
    await tx
      .update(paymentMethods)
      .set({ name: newName })
      .where(eq(paymentMethods.id, parsed.paymentMethodId));

    await tx
      .update(transactions)
      .set({ paymentMethod: newName })
      .where(
        and(
          eq(transactions.userId, session.user.id),
          eq(transactions.paymentMethod, oldName),
        ),
      );
  });

  revalidatePaymentMethodPaths();
}

export async function deletePaymentMethod(paymentMethodId: string) {
  const session = await getSession();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const [row] = await db
    .select()
    .from(paymentMethods)
    .where(
      and(
        eq(paymentMethods.id, paymentMethodId),
        eq(paymentMethods.userId, session.user.id),
      ),
    )
    .limit(1);
  if (!row) throw new Error("Payment method not found");

  const [agg] = await db
    .select({ n: count() })
    .from(transactions)
    .where(
      and(
        eq(transactions.userId, session.user.id),
        eq(transactions.paymentMethod, row.name),
      ),
    );

  const n = Number(agg?.n ?? 0);
  if (n > 0) {
    throw new Error(
      `Cannot delete this method while ${n} transaction(s) use it. Change their payment method first.`,
    );
  }

  await db.delete(paymentMethods).where(eq(paymentMethods.id, paymentMethodId));

  revalidatePaymentMethodPaths();
}
