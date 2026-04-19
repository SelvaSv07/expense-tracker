import { addGoalContribution, createGoal, deleteGoal } from "@/actions/goals";
import { createTransaction, deleteTransaction } from "@/actions/transactions";
import { createCategory, deleteCategory, updateCategory } from "@/actions/categories";
import { deleteBudget, upsertBudget } from "@/actions/budgets";
import { db } from "@/db";
import { budgets, categories } from "@/db/schema";
import { assistantUiOutputSchema } from "@/lib/ai/output";
import { listTransactionsToolEnvelopeForUser } from "@/lib/ai/mcp-queries";
import { toMcpToolResultEnvelope } from "@/lib/ai/tool-ui";
import { getBalance } from "@/lib/cached-queries";
import { getGoalMetrics, listGoals } from "@/lib/queries";
import { and, desc, eq } from "drizzle-orm";
import { DEFAULT_OPENAI_MODEL_ID } from "@/lib/ai/openai-model-options";
import { Agent, tool } from "@openai/agents";
import { z } from "zod";

export type CazuraAgentContext = {
  userId: string;
};

function requireUserId(ctx: unknown): string {
  const userId = (ctx as { context?: { userId?: string } } | undefined)?.context?.userId;
  if (!userId) throw new Error("Missing user context");
  return userId;
}

const readToolInstruction = `You are Cazura AI assistant for personal finance.
You can only help with transactions, categories, budgets, and goals.
Never access or modify authentication, profile, sessions, or API-key settings.

## Category resolution for transactions
When the user wants to add a transaction:
1. Silently call list_categories to fetch available categories. NEVER show the raw category list to the user.
2. Match the transaction description to the best category using common sense:
   - Petrol, fuel, cab, auto, bus, train, flight, toll, parking → Transport
   - Restaurant, cafe, food order, Swiggy, Zomato → Dining
   - Supermarket, vegetables, fruits, provisions → Groceries
   - Electricity, water, internet, phone, gas bill → Utilities
   - Doctor, pharmacy, medicine, hospital → Healthcare
   - Clothes, electronics, Amazon, Flipkart → Shopping
   - Movie, Netflix, concert, game → Entertainment
   Use your judgement for items not listed — most expenses can be reasonably mapped.
3. If the match is obvious (e.g. "petrol" → Transport), proceed directly with that category. Do NOT ask.
4. Only if genuinely ambiguous (could reasonably fit 2+ categories), ask a short question naming just the 2-3 likely options by name, e.g. "Should I file this under Dining or Groceries?"
5. If no existing category fits at all, tell the user and suggest creating one.
6. NEVER dump the full category table. NEVER show category IDs, icons, or colors to the user.

## Defaults
- Payment method: default to "UPI" unless the user explicitly states another method (cash, card, net banking, etc.).
- Date/time: default to the current moment (now) unless the user explicitly mentions a date or time (e.g. "yesterday", "last Friday", "on 10th").

## Write actions
For any write action (create/update/delete), call the tool directly once you have all details. The app shows Yes/No approval buttons automatically.
Do not ask the user to type "approve" or "reject" in chat.
When user intent is to add/update/delete but a required detail (amount) is missing, ask one short follow-up question and wait. Do NOT ask for date or payment method — use the defaults above.
If user replies with confirmation words ("ok", "yes", "do it", "create it"), continue the current pending draft instead of changing topic.

## Display rules
Keep replies concise and action-oriented.
When amounts are user-facing, show INR as whole rupees only (e.g. ₹300).
Do not list all categories, budgets, or transactions unless the user explicitly asks to see them.
When list_transactions has run, do not paste a markdown transaction table; the UI renders the tool output automatically.
For any factual answer about user finance data, you MUST call one or more tools first.
Treat tool outputs as the only source of truth; never fabricate rows, totals, or identifiers.

## Output format
Return output strictly as JSON matching this UI contract:
- formatVersion: "1"
- responseType: question|summary|result|approval_prompt|error
- message: short primary text
- markdown: string or null
- followUpQuestion: string or null (set when details are missing)
- suggestedReplies: always an array (empty if none)
- cards: always an array (empty if none)
- table: object or null.
Never return plain text outside this JSON format.`;

const listTransactionsTool = tool({
  name: "list_transactions",
  description:
    "List transactions for the signed-in user. Server applies defaults: limit 20, no date filter, no search unless provided.",
  parameters: z.object({
    fromIso: z
      .union([z.string().datetime(), z.null()])
      .describe("Start date (ISO), or null for no start filter"),
    toIso: z
      .union([z.string().datetime(), z.null()])
      .describe("End date (ISO), or null for no end filter"),
    search: z
      .union([z.string(), z.null()])
      .describe("Search in transaction name or note, or null for no text filter"),
    limit: z
      .union([z.number().int().min(1).max(100), z.null()])
      .describe("Max rows (default 20 when null)"),
  }),
  async execute(input, context) {
    const userId = requireUserId(context);
    return listTransactionsToolEnvelopeForUser(userId, {
      fromIso: input.fromIso,
      toIso: input.toIso,
      search: input.search,
      limit: input.limit ?? 20,
    });
  },
});

const transactionSummaryTool = tool({
  name: "transaction_summary",
  description: "Get current balance and high-level goal metrics.",
  parameters: z.object({}),
  async execute(_, context) {
    const userId = requireUserId(context);
    const [balance, goalMetrics] = await Promise.all([
      getBalance(userId),
      getGoalMetrics(userId),
    ]);
    return toMcpToolResultEnvelope({
      tool: "transaction_summary",
      kind: "transaction_summary",
      data: {
        balanceInr: balance,
        goalMetrics,
      },
    });
  },
});

const listCategoriesTool = tool({
  name: "list_categories",
  description:
    "List all categories for the user. Use this internally to resolve category IDs when creating transactions. Do NOT display the raw output to the user.",
  parameters: z.object({
    type: z.union([z.enum(["income", "expense"]), z.null()]),
  }),
  async execute(input, context) {
    const userId = requireUserId(context);
    const rows = await db
      .select({
        id: categories.id,
        name: categories.name,
        type: categories.type,
      })
      .from(categories)
      .where(
        and(
          eq(categories.userId, userId),
          input.type ? eq(categories.type, input.type) : undefined,
        ),
      )
      .orderBy(categories.name);
    return { rows };
  },
});

const showCategoriesTool = tool({
  name: "show_categories",
  description:
    "Display the user's categories in a styled UI card. Use ONLY when the user explicitly asks to see or list their categories.",
  parameters: z.object({
    type: z.union([z.enum(["income", "expense"]), z.null()]),
  }),
  async execute(input, context) {
    const userId = requireUserId(context);
    const rows = await db
      .select({
        id: categories.id,
        name: categories.name,
        type: categories.type,
        icon: categories.icon,
        color: categories.color,
      })
      .from(categories)
      .where(
        and(
          eq(categories.userId, userId),
          input.type ? eq(categories.type, input.type) : undefined,
        ),
      )
      .orderBy(categories.name);
    return toMcpToolResultEnvelope({
      tool: "show_categories",
      kind: "category_list",
      data: { rows },
    });
  },
});

const listBudgetsTool = tool({
  name: "list_budgets",
  description: "List budget rows for the user.",
  parameters: z.object({}),
  async execute(_, context) {
    const userId = requireUserId(context);
    const rows = await db
      .select({
        id: budgets.id,
        categoryId: budgets.categoryId,
        recurring: budgets.recurring,
        yearMonth: budgets.yearMonth,
        startsMonth: budgets.startsMonth,
        amount: budgets.amount,
      })
      .from(budgets)
      .where(eq(budgets.userId, userId))
      .orderBy(desc(budgets.updatedAt));
    const mappedRows = rows.map((r) => ({
      ...r,
      amountInr: r.amount,
      yearMonth: r.yearMonth.toISOString(),
      startsMonth: r.startsMonth ? r.startsMonth.toISOString() : null,
    }));
    return toMcpToolResultEnvelope({
      tool: "list_budgets",
      kind: "budget_list",
      data: { rows: mappedRows },
    });
  },
});

const listGoalsTool = tool({
  name: "list_goals",
  description: "List goals and contribution progress.",
  parameters: z.object({}),
  async execute(_, context) {
    const userId = requireUserId(context);
    const rows = await listGoals(userId);
    const mappedRows = rows.map((g) => ({
      ...g,
      targetAmountInr: g.targetAmount,
      savedAmountInr: g.savedAmount,
      targetDate: g.targetDate ? g.targetDate.toISOString() : null,
    }));
    return toMcpToolResultEnvelope({
      tool: "list_goals",
      kind: "goal_list",
      data: { rows: mappedRows },
    });
  },
});

const createTransactionTool = tool({
  name: "create_transaction",
  description: "Create a new transaction (requires approval).",
  parameters: z.object({
    categoryId: z.string(),
    amountInr: z.number().positive(),
    occurredAtIso: z.string().datetime().describe("ISO date-time"),
    transactionName: z.union([z.string(), z.null()]),
    note: z.union([z.string(), z.null()]),
    paymentMethod: z
      .union([z.string(), z.null()])
      .describe(
        "Must match a payment method name from the user's settings (e.g. Cash, Card, UPI), or null.",
      ),
  }),
  needsApproval: true,
  async execute(input, context) {
    requireUserId(context);
    const id = await createTransaction({
      categoryId: input.categoryId,
      amount: Math.round(input.amountInr),
      occurredAt: new Date(input.occurredAtIso),
      transactionName: input.transactionName ?? undefined,
      note: input.note ?? undefined,
      paymentMethod: input.paymentMethod ?? undefined,
    });
    return toMcpToolResultEnvelope({
      tool: "create_transaction",
      kind: "mutation_result",
      data: { ok: true, id },
    });
  },
});

const deleteTransactionTool = tool({
  name: "delete_transaction",
  description: "Delete a transaction by id (requires approval).",
  parameters: z.object({ transactionId: z.string() }),
  needsApproval: true,
  async execute(input, context) {
    requireUserId(context);
    await deleteTransaction(input.transactionId);
    return toMcpToolResultEnvelope({
      tool: "delete_transaction",
      kind: "mutation_result",
      data: { ok: true, id: null },
    });
  },
});

const createCategoryTool = tool({
  name: "create_category",
  description: "Create a category (requires approval).",
  parameters: z.object({
    name: z.string().min(1).max(80),
    type: z.enum(["income", "expense"]),
    icon: z.string(),
    color: z.string(),
  }),
  needsApproval: true,
  async execute(input, context) {
    requireUserId(context);
    await createCategory(input);
    return toMcpToolResultEnvelope({
      tool: "create_category",
      kind: "mutation_result",
      data: { ok: true, id: null },
    });
  },
});

const updateCategoryTool = tool({
  name: "update_category",
  description: "Update an existing category (requires approval).",
  parameters: z.object({
    categoryId: z.string(),
    name: z.string().min(1).max(80),
    type: z.enum(["income", "expense"]),
    icon: z.string(),
    color: z.string(),
  }),
  needsApproval: true,
  async execute(input, context) {
    requireUserId(context);
    await updateCategory(input);
    return toMcpToolResultEnvelope({
      tool: "update_category",
      kind: "mutation_result",
      data: { ok: true, id: null },
    });
  },
});

const deleteCategoryTool = tool({
  name: "delete_category",
  description: "Delete an existing category (requires approval).",
  parameters: z.object({ categoryId: z.string() }),
  needsApproval: true,
  async execute(input, context) {
    requireUserId(context);
    await deleteCategory(input.categoryId);
    return toMcpToolResultEnvelope({
      tool: "delete_category",
      kind: "mutation_result",
      data: { ok: true, id: null },
    });
  },
});

const upsertBudgetTool = tool({
  name: "upsert_budget",
  description: "Create or update a budget for a category and month (requires approval).",
  parameters: z.object({
    categoryId: z.string(),
    amountInr: z.number().nonnegative(),
    recurring: z.boolean(),
    monthIso: z.string().datetime().describe("Any date within the desired month"),
  }),
  needsApproval: true,
  async execute(input, context) {
    requireUserId(context);
    await upsertBudget({
      categoryId: input.categoryId,
      amount: Math.round(input.amountInr),
      recurring: input.recurring,
      month: new Date(input.monthIso),
    });
    return toMcpToolResultEnvelope({
      tool: "upsert_budget",
      kind: "mutation_result",
      data: { ok: true, id: null },
    });
  },
});

const deleteBudgetTool = tool({
  name: "delete_budget",
  description: "Delete a budget by id (requires approval).",
  parameters: z.object({ budgetId: z.string() }),
  needsApproval: true,
  async execute(input, context) {
    requireUserId(context);
    await deleteBudget(input.budgetId);
    return toMcpToolResultEnvelope({
      tool: "delete_budget",
      kind: "mutation_result",
      data: { ok: true, id: null },
    });
  },
});

const createGoalTool = tool({
  name: "create_goal",
  description: "Create a savings goal (requires approval).",
  parameters: z.object({
    name: z.string().min(1),
    targetAmountInr: z.number().positive(),
    targetDateIso: z.union([z.string().datetime(), z.null()]),
    notes: z.union([z.string(), z.null()]),
  }),
  needsApproval: true,
  async execute(input, context) {
    requireUserId(context);
    const id = await createGoal({
      name: input.name,
      targetAmount: Math.round(input.targetAmountInr),
      targetDate: input.targetDateIso ? new Date(input.targetDateIso) : undefined,
      notes: input.notes ?? undefined,
    });
    return toMcpToolResultEnvelope({
      tool: "create_goal",
      kind: "mutation_result",
      data: { ok: true, id },
    });
  },
});

const addGoalContributionTool = tool({
  name: "add_goal_contribution",
  description: "Add money towards a goal (requires approval).",
  parameters: z.object({
    goalId: z.string(),
    amountInr: z.number().positive(),
    occurredAtIso: z.string().datetime(),
    note: z.union([z.string(), z.null()]),
  }),
  needsApproval: true,
  async execute(input, context) {
    requireUserId(context);
    await addGoalContribution({
      goalId: input.goalId,
      amount: Math.round(input.amountInr),
      occurredAt: new Date(input.occurredAtIso),
      note: input.note ?? undefined,
    });
    return toMcpToolResultEnvelope({
      tool: "add_goal_contribution",
      kind: "mutation_result",
      data: { ok: true, id: null },
    });
  },
});

const deleteGoalTool = tool({
  name: "delete_goal",
  description: "Delete a goal by id (requires approval).",
  parameters: z.object({ goalId: z.string() }),
  needsApproval: true,
  async execute(input, context) {
    requireUserId(context);
    await deleteGoal(input.goalId);
    return toMcpToolResultEnvelope({
      tool: "delete_goal",
      kind: "mutation_result",
      data: { ok: true, id: null },
    });
  },
});

const exportTransactionsTool = tool({
  name: "export_transactions",
  description:
    "Get a relative download link for transaction export. Format can be excel or pdf.",
  parameters: z.object({
    format: z.enum(["excel", "pdf"]),
    tf: z.enum(["today", "month", "year", "custom"]),
    from: z.union([z.string(), z.null()]),
    to: z.union([z.string(), z.null()]),
    m: z.union([z.string(), z.null()]),
  }),
  async execute(input) {
    const params = new URLSearchParams();
    params.set("format", input.format);
    params.set("tf", input.tf);
    if (input.from) params.set("from", input.from);
    if (input.to) params.set("to", input.to);
    if (input.m) params.set("m", input.m);
    return toMcpToolResultEnvelope({
      tool: "export_transactions",
      kind: "export_link",
      data: {
        href: `/api/export/transactions?${params.toString()}`,
        method: "GET",
      },
    });
  },
});

export function createCazuraAgent(defaultModel = DEFAULT_OPENAI_MODEL_ID) {
  return new Agent<CazuraAgentContext, typeof assistantUiOutputSchema>({
    name: "Cazura AI Assistant",
    model: defaultModel,
    instructions: readToolInstruction,
    outputType: assistantUiOutputSchema,
    tools: [
      listTransactionsTool,
      transactionSummaryTool,
      listCategoriesTool,
      showCategoriesTool,
      listBudgetsTool,
      listGoalsTool,
      createTransactionTool,
      deleteTransactionTool,
      createCategoryTool,
      updateCategoryTool,
      deleteCategoryTool,
      upsertBudgetTool,
      deleteBudgetTool,
      createGoalTool,
      addGoalContributionTool,
      deleteGoalTool,
      exportTransactionsTool,
    ],
  });
}
