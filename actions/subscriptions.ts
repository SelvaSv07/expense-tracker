"use server";

import { db } from "@/db";
import { categories, subscriptions } from "@/db/schema";
import { bumpUserFinanceCache } from "@/lib/cache";
import { materializeSubscriptionCharges } from "@/lib/subscription-materialize";
import {
  firstDueOnOrAfterUtc,
  lastAllowedDueDateUtc,
} from "@/lib/subscription-schedule";
import { listPaymentMethods } from "@/lib/queries";
import { getSession } from "@/lib/session";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const subscriptionInput = z
  .object({
    serviceName: z.string().min(1, "Service name is required"),
    categoryId: z.string().min(1),
    amount: z.number().int().positive(),
    paymentMethod: z.string().optional(),
    note: z.string().optional(),
    scheduleType: z.enum(["recurring", "until"]),
    billingDay: z.number().int().min(1).max(31),
    untilYear: z.number().int().min(1990).max(2100).optional(),
    untilMonth: z.number().int().min(1).max(12).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.scheduleType === "until") {
      if (data.untilYear == null || data.untilMonth == null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "End month and year are required",
          path: ["untilMonth"],
        });
      }
    }
  });

async function assertExpenseCategory(userId: string, categoryId: string) {
  const [c] = await db
    .select({ id: categories.id, type: categories.type })
    .from(categories)
    .where(
      and(eq(categories.id, categoryId), eq(categories.userId, userId)),
    )
    .limit(1);
  if (!c) throw new Error("Invalid category");
  if (c.type !== "expense") throw new Error("Subscriptions must use an expense category");
}

async function normalizePaymentMethod(
  userId: string,
  raw: string | undefined,
): Promise<string | null> {
  const t = raw?.trim();
  if (!t) return null;
  const methods = await listPaymentMethods(userId);
  const allowed = new Set(methods.map((m) => m.name));
  if (!allowed.has(t)) {
    throw new Error(
      `Invalid payment method "${t}". Add or choose a method from Settings → Payment methods.`,
    );
  }
  return t;
}

function assertScheduleCoherent(
  scheduleType: string,
  billingDay: number,
  untilYear: number | null,
  untilMonth: number | null,
  anchor: Date,
) {
  if (scheduleType !== "until" || untilYear == null || untilMonth == null) {
    return;
  }
  const last = lastAllowedDueDateUtc(
    scheduleType,
    billingDay,
    untilYear,
    untilMonth,
  );
  const first = firstDueOnOrAfterUtc(anchor, billingDay);
  if (last && first.toISOString().slice(0, 10) > last.toISOString().slice(0, 10)) {
    throw new Error("End date must be on or after the first billing date");
  }
}

export async function createSubscription(
  input: z.infer<typeof subscriptionInput>,
) {
  const parsed = subscriptionInput.parse(input);
  const session = await getSession();
  if (!session?.user?.id) throw new Error("Unauthorized");
  const userId = session.user.id;

  await assertExpenseCategory(userId, parsed.categoryId);
  const paymentMethod = await normalizePaymentMethod(
    userId,
    parsed.paymentMethod,
  );

  const now = new Date();
  assertScheduleCoherent(
    parsed.scheduleType,
    parsed.billingDay,
    parsed.scheduleType === "until" ? parsed.untilYear! : null,
    parsed.scheduleType === "until" ? parsed.untilMonth! : null,
    now,
  );

  const id = crypto.randomUUID();
  await db.insert(subscriptions).values({
    id,
    userId,
    serviceName: parsed.serviceName.trim(),
    categoryId: parsed.categoryId,
    amount: parsed.amount,
    paymentMethod,
    note: parsed.note?.trim() || null,
    scheduleType: parsed.scheduleType,
    billingDay: parsed.billingDay,
    untilYear: parsed.scheduleType === "until" ? parsed.untilYear! : null,
    untilMonth: parsed.scheduleType === "until" ? parsed.untilMonth! : null,
  });

  await materializeSubscriptionCharges(userId, { force: true });
  await bumpUserFinanceCache(userId);
  revalidatePath("/transactions");
  revalidatePath("/");
  return id;
}

export async function updateSubscription(
  subscriptionId: string,
  input: z.infer<typeof subscriptionInput>,
) {
  const parsed = subscriptionInput.parse(input);
  const session = await getSession();
  if (!session?.user?.id) throw new Error("Unauthorized");
  const userId = session.user.id;

  const [existing] = await db
    .select()
    .from(subscriptions)
    .where(
      and(eq(subscriptions.id, subscriptionId), eq(subscriptions.userId, userId)),
    )
    .limit(1);
  if (!existing) throw new Error("Not found");

  await assertExpenseCategory(userId, parsed.categoryId);
  const paymentMethod = await normalizePaymentMethod(
    userId,
    parsed.paymentMethod,
  );

  assertScheduleCoherent(
    parsed.scheduleType,
    parsed.billingDay,
    parsed.scheduleType === "until" ? parsed.untilYear! : null,
    parsed.scheduleType === "until" ? parsed.untilMonth! : null,
    existing.createdAt,
  );

  await db
    .update(subscriptions)
    .set({
      serviceName: parsed.serviceName.trim(),
      categoryId: parsed.categoryId,
      amount: parsed.amount,
      paymentMethod,
      note: parsed.note?.trim() || null,
      scheduleType: parsed.scheduleType,
      billingDay: parsed.billingDay,
      untilYear: parsed.scheduleType === "until" ? parsed.untilYear! : null,
      untilMonth: parsed.scheduleType === "until" ? parsed.untilMonth! : null,
      updatedAt: new Date(),
    })
    .where(eq(subscriptions.id, subscriptionId));

  await materializeSubscriptionCharges(userId, { force: true });
  await bumpUserFinanceCache(userId);
  revalidatePath("/transactions");
  revalidatePath("/");
}

export async function deleteSubscription(subscriptionId: string) {
  const session = await getSession();
  if (!session?.user?.id) throw new Error("Unauthorized");
  const userId = session.user.id;

  const [existing] = await db
    .select({ id: subscriptions.id })
    .from(subscriptions)
    .where(
      and(eq(subscriptions.id, subscriptionId), eq(subscriptions.userId, userId)),
    )
    .limit(1);
  if (!existing) throw new Error("Not found");

  await db.delete(subscriptions).where(eq(subscriptions.id, subscriptionId));

  await bumpUserFinanceCache(userId);
  revalidatePath("/transactions");
  revalidatePath("/");
}
