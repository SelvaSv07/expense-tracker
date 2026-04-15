-- Allow tool-approval rows to reference a client session id without a row in ai_conversations (chats are not persisted).
ALTER TABLE "ai_approval_states" DROP CONSTRAINT IF EXISTS "ai_approval_states_conversation_id_ai_conversations_id_fk";
