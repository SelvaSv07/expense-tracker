"use server";

import { decryptApiKey, encryptApiKey } from "@/lib/ai/crypto";
import { getUserAiSettings, upsertUserAiSettings } from "@/lib/ai/store";
import { getSession } from "@/lib/session";
import OpenAI from "openai";
import { z } from "zod";

const upsertSchema = z.object({
  apiKey: z.string().min(20, "Please provide a valid OpenAI API key"),
  model: z.string().min(1).optional(),
});

export async function saveAiSettings(input: z.infer<typeof upsertSchema>) {
  const parsed = upsertSchema.parse(input);
  const session = await getSession();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const apiKey = parsed.apiKey.trim();
  const last4 = apiKey.slice(-4);

  await upsertUserAiSettings({
    userId: session.user.id,
    openaiApiKeyEnc: encryptApiKey(apiKey),
    keyLast4: last4,
    model: parsed.model?.trim() || null,
  });

  return {
    ok: true as const,
    keyLast4: last4,
  };
}

export async function getAiSettingsPreview() {
  const session = await getSession();
  if (!session?.user?.id) throw new Error("Unauthorized");
  const row = await getUserAiSettings(session.user.id);
  return {
    configured: Boolean(row),
    keyLast4: row?.keyLast4 ?? null,
    model: row?.model ?? "gpt-4.1-mini",
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
