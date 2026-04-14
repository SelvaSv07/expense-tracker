/**
 * One-time: align DB with current schema (paisa column names without *_cents).
 * Same as drizzle/0001_rename_monetary_columns.sql. Idempotent: skips missing old columns.
 */
import pg from "pg";

const steps = [
  'ALTER TABLE "wallets" RENAME COLUMN "opening_balance_cents" TO "opening_balance"',
  'ALTER TABLE "transactions" RENAME COLUMN "amount_cents" TO "amount"',
  'ALTER TABLE "budgets" RENAME COLUMN "amount_cents" TO "amount"',
  'ALTER TABLE "goals" RENAME COLUMN "target_amount_cents" TO "target_amount"',
  'ALTER TABLE "goals" RENAME COLUMN "saved_amount_cents" TO "saved_amount"',
  'ALTER TABLE "goal_contributions" RENAME COLUMN "amount_cents" TO "amount"',
];

const url = process.env.DATABASE_URL;
if (!url?.trim()) {
  console.error("Set DATABASE_URL");
  process.exit(1);
}

const pool = new pg.Pool({ connectionString: url });
try {
  for (const stmt of steps) {
    try {
      await pool.query(stmt);
      console.log("OK:", stmt.slice(0, 72) + "…");
    } catch (e) {
      if (e.code === "42703") {
        console.log("Skip (already migrated):", stmt.slice(0, 60) + "…");
      } else {
        throw e;
      }
    }
  }
} finally {
  await pool.end();
}
