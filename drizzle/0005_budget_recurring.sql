ALTER TABLE "budgets" ADD COLUMN IF NOT EXISTS "recurring" boolean DEFAULT false NOT NULL;
