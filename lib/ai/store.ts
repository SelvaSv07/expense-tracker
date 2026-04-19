import { db } from "@/db";
import {
  aiApprovalStates,
  aiConversations,
  aiMessages,
  userAiSettings,
  type aiMessageRole,
} from "@/db/schema";
import { and, asc, desc, eq } from "drizzle-orm";

/** Walk nested causes (Drizzle → pg) for Postgres error codes. */
function pgErrorCode(err: unknown): string | undefined {
  let cur: unknown = err;
  for (let i = 0; i < 6 && cur; i++) {
    if (
      typeof cur === "object" &&
      cur !== null &&
      "code" in cur &&
      typeof (cur as { code: unknown }).code === "string"
    ) {
      return (cur as { code: string }).code;
    }
    if (typeof cur === "object" && cur !== null && "cause" in cur) {
      cur = (cur as { cause: unknown }).cause;
      continue;
    }
    break;
  }
  return undefined;
}

function isPgForeignKeyViolation(err: unknown): boolean {
  return pgErrorCode(err) === "23503";
}

function isPgUniqueViolation(err: unknown): boolean {
  return pgErrorCode(err) === "23505";
}

export type AiMessageRole = (typeof aiMessageRole.enumValues)[number];

export type ChatConversation = {
  id: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
};

export type ChatMessage = {
  id: string;
  role: AiMessageRole;
  content: string;
  metadata: string | null;
  createdAt: Date;
};

export async function getUserAiSettings(userId: string) {
  const [row] = await db
    .select()
    .from(userAiSettings)
    .where(eq(userAiSettings.userId, userId))
    .limit(1);
  return row ?? null;
}

export async function upsertUserAiSettings(input: {
  userId: string;
  openaiApiKeyEnc: string;
  keyLast4: string;
  model?: string | null;
}) {
  const now = new Date();
  const [existing] = await db
    .select({ userId: userAiSettings.userId })
    .from(userAiSettings)
    .where(eq(userAiSettings.userId, input.userId))
    .limit(1);

  if (existing) {
    await db
      .update(userAiSettings)
      .set({
        openaiApiKeyEnc: input.openaiApiKeyEnc,
        keyLast4: input.keyLast4,
        model: input.model ?? null,
        updatedAt: now,
      })
      .where(eq(userAiSettings.userId, input.userId));
  } else {
    await db.insert(userAiSettings).values({
      userId: input.userId,
      openaiApiKeyEnc: input.openaiApiKeyEnc,
      keyLast4: input.keyLast4,
      model: input.model ?? null,
      createdAt: now,
      updatedAt: now,
    });
  }
}

export async function updateUserAiModel(userId: string, model: string) {
  const now = new Date();
  await db
    .update(userAiSettings)
    .set({
      model,
      updatedAt: now,
    })
    .where(eq(userAiSettings.userId, userId));
}

export async function createConversation(userId: string, title = "New Chat") {
  const id = crypto.randomUUID();
  const now = new Date();
  await db.insert(aiConversations).values({
    id,
    userId,
    title,
    createdAt: now,
    updatedAt: now,
  });
  return id;
}

export async function listConversations(userId: string): Promise<ChatConversation[]> {
  return db
    .select({
      id: aiConversations.id,
      title: aiConversations.title,
      createdAt: aiConversations.createdAt,
      updatedAt: aiConversations.updatedAt,
    })
    .from(aiConversations)
    .where(eq(aiConversations.userId, userId))
    .orderBy(desc(aiConversations.updatedAt));
}

export async function ensureConversationOwnership(userId: string, conversationId: string) {
  const [row] = await db
    .select({ id: aiConversations.id })
    .from(aiConversations)
    .where(
      and(
        eq(aiConversations.id, conversationId),
        eq(aiConversations.userId, userId),
      ),
    )
    .limit(1);
  return Boolean(row);
}

export async function listMessages(
  userId: string,
  conversationId: string,
): Promise<ChatMessage[]> {
  return db
    .select({
      id: aiMessages.id,
      role: aiMessages.role,
      content: aiMessages.content,
      metadata: aiMessages.metadata,
      createdAt: aiMessages.createdAt,
    })
    .from(aiMessages)
    .where(
      and(eq(aiMessages.userId, userId), eq(aiMessages.conversationId, conversationId)),
    )
    .orderBy(asc(aiMessages.createdAt));
}

export async function appendMessage(input: {
  userId: string;
  conversationId: string;
  role: AiMessageRole;
  content: string;
  metadata?: string | null;
}) {
  await db.insert(aiMessages).values({
    id: crypto.randomUUID(),
    userId: input.userId,
    conversationId: input.conversationId,
    role: input.role,
    content: input.content,
    metadata: input.metadata ?? null,
    createdAt: new Date(),
  });

  await db
    .update(aiConversations)
    .set({ updatedAt: new Date() })
    .where(eq(aiConversations.id, input.conversationId));
}

/**
 * Older DBs still have FK from ai_approval_states.conversation_id → ai_conversations.
 * Client session ids are not inserted into ai_conversations (chats are not persisted).
 * Migration 0010 drops that FK; until it runs, insert a minimal stub row so approval inserts succeed.
 */
async function ensureConversationStubForLegacyApprovalFk(
  userId: string,
  conversationId: string,
) {
  const [existing] = await db
    .select({ id: aiConversations.id })
    .from(aiConversations)
    .where(eq(aiConversations.id, conversationId))
    .limit(1);
  if (existing) return;

  const now = new Date();
  try {
    await db.insert(aiConversations).values({
      id: conversationId,
      userId,
      title: "AI session",
      createdAt: now,
      updatedAt: now,
    });
  } catch (e) {
    if (!isPgUniqueViolation(e)) throw e;
  }
}

export async function createApprovalState(input: {
  userId: string;
  conversationId: string;
  serializedRunState: string;
  toolName?: string | null;
  toolArguments?: string | null;
  toolCallId?: string | null;
}) {
  const id = crypto.randomUUID();
  const values = {
    id,
    userId: input.userId,
    conversationId: input.conversationId,
    serializedRunState: input.serializedRunState,
    status: "pending" as const,
    toolName: input.toolName ?? null,
    toolArguments: input.toolArguments ?? null,
    toolCallId: input.toolCallId ?? null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  try {
    await db.insert(aiApprovalStates).values(values);
  } catch (e) {
    if (!isPgForeignKeyViolation(e)) throw e;
    await ensureConversationStubForLegacyApprovalFk(input.userId, input.conversationId);
    await db.insert(aiApprovalStates).values(values);
  }
  return id;
}

export async function getApprovalState(userId: string, approvalId: string) {
  const [row] = await db
    .select()
    .from(aiApprovalStates)
    .where(and(eq(aiApprovalStates.id, approvalId), eq(aiApprovalStates.userId, userId)))
    .limit(1);
  return row ?? null;
}

export async function setApprovalStateStatus(
  approvalId: string,
  status: "pending" | "approved" | "rejected" | "expired",
) {
  await db
    .update(aiApprovalStates)
    .set({
      status,
      updatedAt: new Date(),
    })
    .where(eq(aiApprovalStates.id, approvalId));
}
