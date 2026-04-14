import { db } from "@/db";
import {
  aiApprovalStates,
  aiConversations,
  aiMessages,
  userAiSettings,
  type aiMessageRole,
} from "@/db/schema";
import { and, asc, desc, eq } from "drizzle-orm";

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

export async function createApprovalState(input: {
  userId: string;
  conversationId: string;
  serializedRunState: string;
  toolName?: string | null;
  toolArguments?: string | null;
}) {
  const id = crypto.randomUUID();
  await db.insert(aiApprovalStates).values({
    id,
    userId: input.userId,
    conversationId: input.conversationId,
    serializedRunState: input.serializedRunState,
    status: "pending",
    toolName: input.toolName ?? null,
    toolArguments: input.toolArguments ?? null,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
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
