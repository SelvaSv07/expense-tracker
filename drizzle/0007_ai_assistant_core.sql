DO $$
BEGIN
  CREATE TYPE "public"."ai_message_role" AS ENUM('user', 'assistant', 'tool', 'system');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE "public"."ai_approval_status" AS ENUM('pending', 'approved', 'rejected', 'expired');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "user_ai_settings" (
  "user_id" text PRIMARY KEY NOT NULL,
  "openai_api_key_enc" text NOT NULL,
  "key_last4" text NOT NULL,
  "model" text,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "ai_conversations" (
  "id" text PRIMARY KEY NOT NULL,
  "user_id" text NOT NULL,
  "title" text DEFAULT 'New Chat' NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "ai_messages" (
  "id" text PRIMARY KEY NOT NULL,
  "conversation_id" text NOT NULL,
  "user_id" text NOT NULL,
  "role" "ai_message_role" NOT NULL,
  "content" text NOT NULL,
  "metadata" text,
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "ai_approval_states" (
  "id" text PRIMARY KEY NOT NULL,
  "user_id" text NOT NULL,
  "conversation_id" text NOT NULL,
  "serialized_run_state" text NOT NULL,
  "status" "ai_approval_status" DEFAULT 'pending' NOT NULL,
  "tool_name" text,
  "tool_arguments" text,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

DO $$
BEGIN
  ALTER TABLE "user_ai_settings"
    ADD CONSTRAINT "user_ai_settings_user_id_user_id_fk"
    FOREIGN KEY ("user_id") REFERENCES "public"."user"("id")
    ON DELETE cascade ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE "ai_conversations"
    ADD CONSTRAINT "ai_conversations_user_id_user_id_fk"
    FOREIGN KEY ("user_id") REFERENCES "public"."user"("id")
    ON DELETE cascade ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE "ai_messages"
    ADD CONSTRAINT "ai_messages_conversation_id_ai_conversations_id_fk"
    FOREIGN KEY ("conversation_id") REFERENCES "public"."ai_conversations"("id")
    ON DELETE cascade ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE "ai_messages"
    ADD CONSTRAINT "ai_messages_user_id_user_id_fk"
    FOREIGN KEY ("user_id") REFERENCES "public"."user"("id")
    ON DELETE cascade ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE "ai_approval_states"
    ADD CONSTRAINT "ai_approval_states_user_id_user_id_fk"
    FOREIGN KEY ("user_id") REFERENCES "public"."user"("id")
    ON DELETE cascade ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE "ai_approval_states"
    ADD CONSTRAINT "ai_approval_states_conversation_id_ai_conversations_id_fk"
    FOREIGN KEY ("conversation_id") REFERENCES "public"."ai_conversations"("id")
    ON DELETE cascade ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS "ai_conversations_user_updated_idx"
  ON "ai_conversations" USING btree ("user_id", "updated_at");

CREATE INDEX IF NOT EXISTS "ai_messages_user_conversation_created_idx"
  ON "ai_messages" USING btree ("user_id", "conversation_id", "created_at");

CREATE INDEX IF NOT EXISTS "ai_approval_states_user_conversation_idx"
  ON "ai_approval_states" USING btree ("user_id", "conversation_id");

CREATE INDEX IF NOT EXISTS "ai_approval_states_status_created_idx"
  ON "ai_approval_states" USING btree ("status", "created_at");
