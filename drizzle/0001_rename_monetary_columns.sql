-- One-time migration: rename monetary columns from *_cents to amount / opening_balance / etc.
-- Run only if your database was created with the previous schema (amount_cents, etc.).
-- New installs can use `npm run db:push` from the current schema without this file.

ALTER TABLE "wallets" RENAME COLUMN "opening_balance_cents" TO "opening_balance";
ALTER TABLE "transactions" RENAME COLUMN "amount_cents" TO "amount";
ALTER TABLE "budgets" RENAME COLUMN "amount_cents" TO "amount";
ALTER TABLE "goals" RENAME COLUMN "target_amount_cents" TO "target_amount";
ALTER TABLE "goals" RENAME COLUMN "saved_amount_cents" TO "saved_amount";
ALTER TABLE "goal_contributions" RENAME COLUMN "amount_cents" TO "amount";
