CREATE TABLE IF NOT EXISTS "payment_methods" (
  "id" text PRIMARY KEY NOT NULL,
  "user_id" text NOT NULL,
  "name" text NOT NULL,
  "sort_order" integer DEFAULT 0 NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "payment_methods_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION
);

CREATE INDEX IF NOT EXISTS "payment_methods_user_id_idx" ON "payment_methods" ("user_id");

CREATE UNIQUE INDEX IF NOT EXISTS "payment_methods_user_name_uidx" ON "payment_methods" ("user_id", "name");
