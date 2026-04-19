CREATE TABLE IF NOT EXISTS "subscriptions" (
  "id" text PRIMARY KEY NOT NULL,
  "user_id" text NOT NULL,
  "service_name" text NOT NULL,
  "category_id" text NOT NULL,
  "amount" integer NOT NULL,
  "payment_method" text,
  "note" text,
  "schedule_type" text NOT NULL,
  "billing_day" integer NOT NULL,
  "until_year" integer,
  "until_month" integer,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "subscriptions_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION,
  CONSTRAINT "subscriptions_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE NO ACTION
);

CREATE INDEX IF NOT EXISTS "subscriptions_user_id_idx" ON "subscriptions" ("user_id");

ALTER TABLE "transactions" ADD COLUMN IF NOT EXISTS "subscription_id" text;

DO $$ BEGIN
  ALTER TABLE "transactions"
    ADD CONSTRAINT "transactions_subscription_id_subscriptions_id_fk"
    FOREIGN KEY ("subscription_id") REFERENCES "subscriptions"("id") ON DELETE SET NULL ON UPDATE NO ACTION;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE INDEX IF NOT EXISTS "transactions_subscription_id_idx" ON "transactions" ("subscription_id");

ALTER TABLE "user_finance" ADD COLUMN IF NOT EXISTS "last_subscription_materialize_on" date;
