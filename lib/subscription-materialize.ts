import { db } from "@/db";
import { subscriptions, transactions, userFinance } from "@/db/schema";
import { bumpUserFinanceCache } from "@/lib/cache";
import {
  endOfMonthUtc,
  firstDueOnOrAfterUtc,
  lastAllowedDueDateUtc,
  nextBillingDateAfterUtc,
  startOfMonthUtc,
  utcDateKey,
} from "@/lib/subscription-schedule";
import { and, eq, gte, lte } from "drizzle-orm";

export type MaterializeResult = { created: number; skippedThrottle: boolean };

async function hasChargeForSubscriptionMonth(
  userId: string,
  subscriptionId: string,
  monthCursor: Date,
): Promise<boolean> {
  const rangeStart = startOfMonthUtc(monthCursor);
  const rangeEnd = endOfMonthUtc(monthCursor);
  const [row] = await db
    .select({ id: transactions.id })
    .from(transactions)
    .where(
      and(
        eq(transactions.userId, userId),
        eq(transactions.subscriptionId, subscriptionId),
        gte(transactions.occurredAt, rangeStart),
        lte(transactions.occurredAt, rangeEnd),
      ),
    )
    .limit(1);
  return !!row;
}

/**
 * Creates past-due `transactions` for all subscriptions up to today (UTC).
 * Without `force`, runs at most once per UTC calendar day per user.
 * With `force`, always runs (e.g. after creating or editing a subscription).
 */
export async function materializeSubscriptionCharges(
  userId: string,
  opts?: { force?: boolean },
): Promise<MaterializeResult> {
  const today = utcDateKey();
  let skippedThrottle = false;

  if (!opts?.force) {
    const [fin] = await db
      .select({
        last: userFinance.lastSubscriptionMaterializeOn,
      })
      .from(userFinance)
      .where(eq(userFinance.userId, userId))
      .limit(1);

    const lastKey =
      fin?.last == null
        ? null
        : typeof fin.last === "string"
          ? fin.last
          : utcDateKey(new Date(fin.last as unknown as string));

    if (lastKey === today) {
      skippedThrottle = true;
      return { created: 0, skippedThrottle };
    }
  }

  const rows = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.userId, userId));

  let created = 0;

  for (const sub of rows) {
    const last = lastAllowedDueDateUtc(
      sub.scheduleType,
      sub.billingDay,
      sub.untilYear,
      sub.untilMonth,
    );
    const lastKey = last ? last.toISOString().slice(0, 10) : null;

    let cursor = firstDueOnOrAfterUtc(sub.createdAt, sub.billingDay);

    while (cursor.toISOString().slice(0, 10) <= today) {
      if (lastKey && cursor.toISOString().slice(0, 10) > lastKey) break;

      const exists = await hasChargeForSubscriptionMonth(
        userId,
        sub.id,
        cursor,
      );
      if (!exists) {
        const id = crypto.randomUUID();
        await db.insert(transactions).values({
          id,
          userId,
          categoryId: sub.categoryId,
          amount: sub.amount,
          occurredAt: cursor,
          transactionName: sub.serviceName,
          note: sub.note,
          paymentMethod: sub.paymentMethod,
          subscriptionId: sub.id,
        });
        created += 1;
      }

      cursor = nextBillingDateAfterUtc(cursor, sub.billingDay);
    }
  }

  await db
    .update(userFinance)
    .set({ lastSubscriptionMaterializeOn: today })
    .where(eq(userFinance.userId, userId));

  if (created > 0) {
    await bumpUserFinanceCache(userId);
  }

  return { created, skippedThrottle };
}
