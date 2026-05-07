/**
 * Inserts 100 sample transactions spread across the current calendar month.
 *
 * Usage:
 *   npx tsx scripts/seed-100-transactions.ts
 *
 * Optional: SEED_USER_EMAIL=user@example.com — defaults to the first user in `user`.
 */

import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { drizzle } from "drizzle-orm/node-postgres";
import { eq } from "drizzle-orm";
import pg from "pg";
import * as schema from "../db/schema";
import { bumpUserFinanceCache } from "../lib/cache";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

dotenv.config({ path: path.join(root, ".env") });
dotenv.config({ path: path.join(root, ".env.local"), override: true });

const LABELS = [
  "Coffee",
  "Groceries",
  "Fuel",
  "Dining out",
  "Online order",
  "Subscription",
  "Pharmacy",
  "Transit",
  "Utilities",
  "Misc",
];

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomItem<T>(items: T[]): T {
  return items[randomInt(0, items.length - 1)]!;
}

function fmtLocalDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Random `Date` within [start, end] inclusive of calendar days (local). */
function randomDateInRange(start: Date, end: Date): Date {
  const a = start.getTime();
  const b = end.getTime();
  const t = a + Math.random() * (b - a);
  const d = new Date(t);
  d.setHours(randomInt(6, 23), randomInt(0, 59), randomInt(0, 59), randomInt(0, 999));
  return d;
}

async function main() {
  const url = process.env.DATABASE_URL?.trim();
  if (!url) {
    console.error("DATABASE_URL is not set (.env.local)");
    process.exit(1);
  }

  const email = process.env.SEED_USER_EMAIL?.trim();

  const pool = new pg.Pool({ connectionString: url });
  const db = drizzle(pool, { schema });

  try {
    let userRow: { id: string } | undefined;
    if (email) {
      const rows = await db
        .select({ id: schema.user.id })
        .from(schema.user)
        .where(eq(schema.user.email, email))
        .limit(1);
      userRow = rows[0];
      if (!userRow) {
        console.error(`No user found with email: ${email}`);
        process.exit(1);
      }
    } else {
      const rows = await db.select({ id: schema.user.id }).from(schema.user).limit(1);
      userRow = rows[0];
      if (!userRow) {
        console.error("No users in database. Sign up first.");
        process.exit(1);
      }
    }

    const userId = userRow.id;

    const cats = await db
      .select({ id: schema.categories.id, type: schema.categories.type })
      .from(schema.categories)
      .where(eq(schema.categories.userId, userId));

    if (cats.length === 0) {
      console.error("No categories for this user. Add categories in the app first.");
      process.exit(1);
    }

    const expenseCats = cats.filter((c) => c.type === "expense");
    const categoryPool = expenseCats.length > 0 ? expenseCats : cats;

    const pmRows = await db
      .select({ name: schema.paymentMethods.name })
      .from(schema.paymentMethods)
      .where(eq(schema.paymentMethods.userId, userId));
    const paymentNames = pmRows.map((r) => r.name);

    const now = new Date();
    const year = now.getFullYear();
    const monthIndex = now.getMonth();
    const start = new Date(year, monthIndex, 1, 0, 0, 0, 0);
    const end = new Date(year, monthIndex + 1, 0, 23, 59, 59, 999);

    const rows: (typeof schema.transactions.$inferInsert)[] = [];
    for (let i = 0; i < 100; i++) {
      const cat = randomItem(categoryPool);
      const amount = randomInt(25, 8_000);
      const occurredAt = randomDateInRange(start, end);
      const pm =
        paymentNames.length > 0 && Math.random() > 0.15
          ? randomItem(paymentNames)
          : null;

      rows.push({
        id: crypto.randomUUID(),
        userId,
        categoryId: cat.id,
        amount,
        occurredAt,
        transactionName: randomItem(LABELS),
        note: Math.random() > 0.7 ? `Seed batch ${i + 1}` : null,
        paymentMethod: pm,
      });
    }

    await db.insert(schema.transactions).values(rows);
    await bumpUserFinanceCache(userId);

    console.log(
      `Inserted 100 transactions for user ${userId} (${fmtLocalDate(start)} … ${fmtLocalDate(end)}).`,
    );
  } finally {
    await pool.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
