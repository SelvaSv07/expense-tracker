DO $$ BEGIN
  ALTER TABLE "ai_approval_states" ADD COLUMN "tool_call_id" text;
EXCEPTION
  WHEN duplicate_column THEN null;
END $$;