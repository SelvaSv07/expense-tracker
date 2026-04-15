"use server";

import { decryptApiKey, encryptApiKey } from "@/lib/ai/crypto";
import {
  getUserAiSettings,
  updateUserAiModel,
  upsertUserAiSettings,
} from "@/lib/ai/store";
import { getSession } from "@/lib/session";
import OpenAI from "openai";
import { DEFAULT_OPENAI_MODEL_ID } from "@/lib/ai/openai-model-options";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const modelSchema = z
  .string()
  .min(1, "Model is required")
  .max(128, "Model id is too long")
  .transform((s) => s.trim());

const saveSchema = z.object({
  /** When empty, only the model is updated if a key is already saved. */
  apiKey: z.string().optional(),
  model: modelSchema,
});

function revalidateAiSettings() {
  revalidatePath("/settings");
  revalidatePath("/settings/ai");
  revalidatePath("/ai");
}

export async function saveAiSettings(input: z.infer<typeof saveSchema>) {
  const parsed = saveSchema.parse(input);
  const session = await getSession();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const existing = await getUserAiSettings(session.user.id);
  const keyTrim = parsed.apiKey?.trim() ?? "";

  if (keyTrim.length > 0) {
    if (keyTrim.length < 20) {
      throw new Error("Please provide a valid OpenAI API key");
    }
    const last4 = keyTrim.slice(-4);
    await upsertUserAiSettings({
      userId: session.user.id,
      openaiApiKeyEnc: encryptApiKey(keyTrim),
      keyLast4: last4,
      model: parsed.model,
    });
    revalidateAiSettings();
    return {
      ok: true as const,
      keyLast4: last4,
    };
  }

  if (existing) {
    await updateUserAiModel(session.user.id, parsed.model);
    revalidateAiSettings();
    return {
      ok: true as const,
      keyLast4: existing.keyLast4,
    };
  }

  throw new Error(
    "Enter your OpenAI API key once to get started. After that you can change the model anytime without re-entering the key.",
  );
}

export async function getAiSettingsPreview() {
  const session = await getSession();
  if (!session?.user?.id) throw new Error("Unauthorized");
  const row = await getUserAiSettings(session.user.id);
  return {
    configured: Boolean(row),
    keyLast4: row?.keyLast4 ?? null,
    model: row?.model ?? DEFAULT_OPENAI_MODEL_ID,
  };
}

export async function testAiKey() {
  const session = await getSession();
  if (!session?.user?.id) throw new Error("Unauthorized");
  const row = await getUserAiSettings(session.user.id);
  if (!row) throw new Error("No API key configured");

  const client = new OpenAI({ apiKey: decryptApiKey(row.openaiApiKeyEnc) });
  await client.models.list();
  return { ok: true as const };
}
