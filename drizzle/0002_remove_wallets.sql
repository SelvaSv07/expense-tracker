-- Migrate from multi-wallet model to single ledger per user.
-- Run after 0001 (if used). Safe to run once on a DB that still has `wallets`.

CREATE TABLE IF NOT EXISTS "user_finance" (
  "user_id" text PRIMARY KEY NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "opening_balance" integer DEFAULT 0 NOT NULL
);

INSERT INTO "user_finance" ("user_id", "opening_balance")
SELECT w."user_id", COALESCE(SUM(w."opening_balance"), 0)::integer
FROM "wallets" w
GROUP BY w."user_id"
ON CONFLICT ("user_id") DO UPDATE SET
  "opening_balance" = "user_finance"."opening_balance" + EXCLUDED."opening_balance";

ALTER TABLE "transactions" ADD COLUMN IF NOT EXISTS "user_id" text;
UPDATE "transactions" t
SET "user_id" = w."user_id"
FROM "wallets" w
WHERE w."id" = t."wallet_id";

INSERT INTO "user_finance" ("user_id", "opening_balance")
SELECT DISTINCT t."user_id", 0
FROM "transactions" t
WHERE t."user_id" IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM "user_finance" f WHERE f."user_id" = t."user_id"
  );

ALTER TABLE "transactions" ALTER COLUMN "user_id" SET NOT NULL;

ALTER TABLE "budgets" ADD COLUMN IF NOT EXISTS "user_id" text;
UPDATE "budgets" b
SET "user_id" = w."user_id"
FROM "wallets" w
WHERE w."id" = b."wallet_id";

ALTER TABLE "budgets" ALTER COLUMN "user_id" SET NOT NULL;

DELETE FROM "budgets" a
USING "budgets" b
WHERE a."user_id" = b."user_id"
  AND a."category_id" = b."category_id"
  AND a."year_month" = b."year_month"
  AND a."id"::text < b."id"::text;

DROP INDEX IF EXISTS "budgets_wallet_category_month_uidx";

ALTER TABLE "budgets" DROP CONSTRAINT IF EXISTS "budgets_wallet_id_wallets_id_fk";
ALTER TABLE "budgets" DROP CONSTRAINT IF EXISTS "budgets_wallet_id_fkey";
ALTER TABLE "budgets" DROP COLUMN IF EXISTS "wallet_id";

CREATE UNIQUE INDEX IF NOT EXISTS "budgets_user_category_month_uidx"
  ON "budgets" ("user_id", "category_id", "year_month");

DROP INDEX IF EXISTS "transactions_wallet_occurred_idx";

ALTER TABLE "transactions" DROP CONSTRAINT IF EXISTS "transactions_wallet_id_wallets_id_fk";
ALTER TABLE "transactions" DROP CONSTRAINT IF EXISTS "transactions_wallet_id_fkey";
ALTER TABLE "transactions" DROP COLUMN IF EXISTS "wallet_id";

CREATE INDEX IF NOT EXISTS "transactions_user_occurred_idx"
  ON "transactions" ("user_id", "occurred_at");

ALTER TABLE "transactions" DROP CONSTRAINT IF EXISTS "transactions_user_id_user_id_fk";
ALTER TABLE "transactions"
  ADD CONSTRAINT "transactions_user_id_user_id_fk"
  FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE;

ALTER TABLE "budgets" DROP CONSTRAINT IF EXISTS "budgets_user_id_user_id_fk";
ALTER TABLE "budgets"
  ADD CONSTRAINT "budgets_user_id_user_id_fk"
  FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE;

DROP TABLE IF EXISTS "wallets";
