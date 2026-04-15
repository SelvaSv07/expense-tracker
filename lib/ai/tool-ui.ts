import { z } from "zod";

export const transactionListRowSchema = z.object({
  id: z.string(),
  dateTimeIso: z.string(),
  nameNote: z.string(),
  category: z.string(),
  method: z.string(),
  amountInr: z.number(),
});

const transactionListToolDataSchema = z.object({
  kind: z.literal("transaction_list"),
  tool: z.literal("list_transactions"),
  data: z.object({
    rows: z.array(transactionListRowSchema),
  }),
});

const transactionSummaryToolDataSchema = z.object({
  kind: z.literal("transaction_summary"),
  tool: z.literal("transaction_summary"),
  data: z.object({
    balanceInr: z.number(),
    goalMetrics: z.unknown(),
  }),
});

const categoryListToolDataSchema = z.object({
  kind: z.literal("category_list"),
  tool: z.literal("show_categories"),
  data: z.object({
    rows: z.array(
      z.object({
        id: z.string(),
        name: z.string(),
        type: z.enum(["income", "expense"]),
        icon: z.string().nullable(),
        color: z.string(),
      }),
    ),
  }),
});

const budgetListToolDataSchema = z.object({
  kind: z.literal("budget_list"),
  tool: z.literal("list_budgets"),
  data: z.object({
    rows: z.array(
      z.object({
        id: z.string(),
        categoryId: z.string(),
        recurring: z.boolean(),
        yearMonth: z.string(),
        startsMonth: z.string().nullable(),
        amount: z.number(),
        amountInr: z.number(),
      }),
    ),
  }),
});

const goalListToolDataSchema = z.object({
  kind: z.literal("goal_list"),
  tool: z.literal("list_goals"),
  data: z.object({
    rows: z.array(
      z.object({
        id: z.string(),
        name: z.string(),
        targetAmount: z.number(),
        savedAmount: z.number(),
        targetAmountInr: z.number(),
        savedAmountInr: z.number(),
        targetDate: z.string().nullable(),
        notes: z.string().nullable(),
      }),
    ),
  }),
});

const mutationResultToolDataSchema = z.object({
  kind: z.literal("mutation_result"),
  tool: z.string(),
  data: z.object({
    ok: z.boolean(),
    id: z.string().nullable(),
  }),
});

const exportLinkToolDataSchema = z.object({
  kind: z.literal("export_link"),
  tool: z.literal("export_transactions"),
  data: z.object({
    href: z.string(),
    method: z.literal("GET"),
  }),
});

export const assistantToolDataSchema = z.discriminatedUnion("kind", [
  transactionListToolDataSchema,
  transactionSummaryToolDataSchema,
  categoryListToolDataSchema,
  budgetListToolDataSchema,
  goalListToolDataSchema,
  mutationResultToolDataSchema,
  exportLinkToolDataSchema,
]);

export type AssistantToolData = z.infer<typeof assistantToolDataSchema>;
export type AssistantToolDataList = AssistantToolData[];

export function toMcpToolResultEnvelope(input: {
  tool: string;
  kind: AssistantToolData["kind"];
  data: unknown;
}) {
  return {
    mcpVersion: "1" as const,
    tool: input.tool,
    kind: input.kind,
    data: input.data,
  };
}

export function parseToolResultOutput(rawOutput: unknown): unknown {
  if (typeof rawOutput === "string") {
    try {
      const once = JSON.parse(rawOutput) as unknown;
      if (typeof once === "string") {
        try {
          return JSON.parse(once) as unknown;
        } catch {
          return once;
        }
      }
      return once;
    } catch {
      return null;
    }
  }

  if (rawOutput && typeof rawOutput === "object") {
    const maybeText = (rawOutput as { type?: unknown; text?: unknown }).type;
    if (maybeText === "text") {
      const text = (rawOutput as { text?: unknown }).text;
      if (typeof text === "string") {
        try {
          return JSON.parse(text);
        } catch {
          return null;
        }
      }
    }
  }

  return rawOutput;
}
