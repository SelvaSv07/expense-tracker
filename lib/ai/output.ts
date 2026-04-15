import { z } from "zod";

export const uiFieldSchema = z.object({
  label: z.string(),
  value: z.string(),
});

export const uiCardSchema = z.object({
  title: z.string(),
  fields: z.array(uiFieldSchema).default([]),
});

export const uiTableSchema = z.object({
  columns: z.array(z.string()).default([]),
  rows: z.array(z.array(z.string())).default([]),
});

export const assistantUiOutputSchema = z.object({
  formatVersion: z.literal("1"),
  responseType: z.enum([
    "question",
    "summary",
    "result",
    "approval_prompt",
    "error",
  ]),
  message: z.string(),
  markdown: z.string().nullable(),
  followUpQuestion: z.string().nullable(),
  suggestedReplies: z.array(z.string()),
  cards: z.array(uiCardSchema),
  table: uiTableSchema.nullable(),
});

export type AssistantUiOutput = z.infer<typeof assistantUiOutputSchema>;

export function outputToDisplayText(payload: AssistantUiOutput | null): string {
  if (!payload) return "";
  if (payload.markdown?.trim()) return payload.markdown.trim();
  if (payload.followUpQuestion?.trim()) {
    return `${payload.message}\n\n${payload.followUpQuestion}`;
  }
  return payload.message;
}
