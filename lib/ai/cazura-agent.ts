import { addGoalContribution, createGoal, deleteGoal } from "@/actions/goals";
import { createTransaction, deleteTransaction } from "@/actions/transactions";
import { createCategory, deleteCategory, updateCategory } from "@/actions/categories";
import { deleteBudget, upsertBudget } from "@/actions/budgets";
import { db } from "@/db";
import { budgets, categories, goals, transactions } from "@/db/schema";
import { getBalance, getGoalMetrics, listGoals } from "@/lib/queries";
import { and, desc, eq, gte, ilike, lte, sql } from "drizzle-orm";
import { Agent, tool } from "@openai/agents";
import { z } from "zod";

export type CazuraAgentContext = {
  userId: string;
};

const readToolInstruction = `You are Cazura AI assistant for personal finance.
You can only help with transactions, categories, budgets, and goals.
Never access or modify authentication, profile, sessions, or API-key settings.
For any write action (create/update/delete), call the available tool and wait for explicit approval from the user.
When amounts are user-facing, show INR with 2 decimals.`;

const listTransactionsTool = tool({
  name: "list_transactions",
  description:
    "List transactions for the signed-in user with optional text and date filters.",
  parameters: z.object({
    fromIso: z.string().optional().describe("Start date (ISO)"),
    toIso: z.string().optional().describe("End date (ISO)"),
    search: z.string().optional().describe("Search in transaction name or note"),
    limit: z.number().int().min(1).max(100).optional(),
  }),
  async execute(input, context) {
    const where = [eq(transactions.userId, context.context.userId)];
    if (input.fromIso) where.push(gte(transactions.occurredAt, new Date(input.fromIso)));
    if (input.toIso) where.push(lte(transactions.occurredAt, new Date(input.toIso)));
    if (input.search?.trim()) {
      const q = `%${input.search.trim()}%`;
      where.push(
        sql`(${transactions.transactionName} ilike ${q} or ${transactions.note} ilike ${q})`,
      );
    }
    const rows = await db
      .select({
        id: transactions.id,
        amount: transactions.amount,
        occurredAt: transactions.occurredAt,
        transactionName: transactions.transactionName,
        note: transactions.note,
        paymentMethod: transactions.paymentMethod,
        categoryName: categories.name,
        categoryType: categories.type,
      })
      .from(transactions)
      .innerJoin(categories, eq(transactions.categoryId, categories.id))
      .where(and(...where))
      .orderBy(desc(transactions.occurredAt))
      .limit(input.limit ?? 20);
    return rows.map((r) => ({
      ...r,
      amountInr: Number((r.amount / 100).toFixed(2)),
      occurredAt: r.occurredAt.toISOString(),
    }));
  },
});

const transactionSummaryTool = tool({
  name: "transaction_summary",
  description: "Get current balance and high-level goal metrics.",
  parameters: z.object({}),
  async execute(_, context) {
    const [balance, goalMetrics] = await Promise.all([
      getBalance(context.context.userId),
      getGoalMetrics(context.context.userId),
    ]);
    return {
      balancePaisa: balance,
      balanceInr: Number((balance / 100).toFixed(2)),
      goalMetrics,
    };
  },
});

const listCategoriesTool = tool({
  name: "list_categories",
  description: "List all categories for the user.",
  parameters: z.object({ type: z.enum(["income", "expense"]).optional() }),
  async execute(input, context) {
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
          eq(categories.userId, context.context.userId),
          input.type ? eq(categories.type, input.type) : undefined,
        ),
      )
      .orderBy(categories.name);
    return rows;
  },
});

const listBudgetsTool = tool({
  name: "list_budgets",
  description: "List budget rows for the user.",
  parameters: z.object({}),
  async execute(_, context) {
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
      .where(eq(budgets.userId, context.context.userId))
      .orderBy(desc(budgets.updatedAt));
    return rows.map((r) => ({
      ...r,
      amountInr: Number((r.amount / 100).toFixed(2)),
      yearMonth: r.yearMonth.toISOString(),
      startsMonth: r.startsMonth ? r.startsMonth.toISOString() : null,
    }));
  },
});

const listGoalsTool = tool({
  name: "list_goals",
  description: "List goals and contribution progress.",
  parameters: z.object({}),
  async execute(_, context) {
    const rows = await listGoals(context.context.userId);
    return rows.map((g) => ({
      ...g,
      targetAmountInr: Number((g.targetAmount / 100).toFixed(2)),
      savedAmountInr: Number((g.savedAmount / 100).toFixed(2)),
      targetDate: g.targetDate ? g.targetDate.toISOString() : null,
    }));
  },
});

const createTransactionTool = tool({
  name: "create_transaction",
  description: "Create a new transaction (requires approval).",
  parameters: z.object({
    categoryId: z.string(),
    amountInr: z.number().positive(),
    occurredAtIso: z.string().describe("ISO date-time"),
    transactionName: z.string().optional(),
    note: z.string().optional(),
    paymentMethod: z.string().optional(),
  }),
  needsApproval: true,
  async execute(input) {
    const id = await createTransaction({
      categoryId: input.categoryId,
      amount: Math.round(input.amountInr * 100),
      occurredAt: new Date(input.occurredAtIso),
      transactionName: input.transactionName,
      note: input.note,
      paymentMethod: input.paymentMethod,
    });
    return { id };
  },
});

const deleteTransactionTool = tool({
  name: "delete_transaction",
  description: "Delete a transaction by id (requires approval).",
  parameters: z.object({ transactionId: z.string() }),
  needsApproval: true,
  async execute(input) {
    await deleteTransaction(input.transactionId);
    return { ok: true };
  },
});

const createCategoryTool = tool({
  name: "create_category",
  description: "Create a category (requires approval).",
  parameters: z.object({
    name: z.string(),
    type: z.enum(["income", "expense"]),
    icon: z.string(),
    color: z.string(),
  }),
  needsApproval: true,
  async execute(input) {
    await createCategory(input);
    return { ok: true };
  },
});

const updateCategoryTool = tool({
  name: "update_category",
  description: "Update an existing category (requires approval).",
  parameters: z.object({
    categoryId: z.string(),
    name: z.string(),
    type: z.enum(["income", "expense"]),
    icon: z.string(),
    color: z.string(),
  }),
  needsApproval: true,
  async execute(input) {
    await updateCategory(input);
    return { ok: true };
  },
});

const deleteCategoryTool = tool({
  name: "delete_category",
  description: "Delete an existing category (requires approval).",
  parameters: z.object({ categoryId: z.string() }),
  needsApproval: true,
  async execute(input) {
    await deleteCategory(input.categoryId);
    return { ok: true };
  },
});

const upsertBudgetTool = tool({
  name: "upsert_budget",
  description: "Create or update a budget for a category and month (requires approval).",
  parameters: z.object({
    categoryId: z.string(),
    amountInr: z.number().nonnegative(),
    recurring: z.boolean(),
    monthIso: z.string().describe("Any date within the desired month"),
  }),
  needsApproval: true,
  async execute(input) {
    await upsertBudget({
      categoryId: input.categoryId,
      amount: Math.round(input.amountInr * 100),
      recurring: input.recurring,
      month: new Date(input.monthIso),
    });
    return { ok: true };
  },
});

const deleteBudgetTool = tool({
  name: "delete_budget",
  description: "Delete a budget by id (requires approval).",
  parameters: z.object({ budgetId: z.string() }),
  needsApproval: true,
  async execute(input) {
    await deleteBudget(input.budgetId);
    return { ok: true };
  },
});

const createGoalTool = tool({
  name: "create_goal",
  description: "Create a savings goal (requires approval).",
  parameters: z.object({
    name: z.string(),
    targetAmountInr: z.number().positive(),
    targetDateIso: z.string().optional(),
    notes: z.string().optional(),
  }),
  needsApproval: true,
  async execute(input) {
    const id = await createGoal({
      name: input.name,
      targetAmount: Math.round(input.targetAmountInr * 100),
      targetDate: input.targetDateIso ? new Date(input.targetDateIso) : undefined,
      notes: input.notes,
    });
    return { id };
  },
});

const addGoalContributionTool = tool({
  name: "add_goal_contribution",
  description: "Add money towards a goal (requires approval).",
  parameters: z.object({
    goalId: z.string(),
    amountInr: z.number().positive(),
    occurredAtIso: z.string(),
    note: z.string().optional(),
  }),
  needsApproval: true,
  async execute(input) {
    await addGoalContribution({
      goalId: input.goalId,
      amount: Math.round(input.amountInr * 100),
      occurredAt: new Date(input.occurredAtIso),
      note: input.note,
    });
    return { ok: true };
  },
});

const deleteGoalTool = tool({
  name: "delete_goal",
  description: "Delete a goal by id (requires approval).",
  parameters: z.object({ goalId: z.string() }),
  needsApproval: true,
  async execute(input) {
    await deleteGoal(input.goalId);
    return { ok: true };
  },
});

const exportTransactionsTool = tool({
  name: "export_transactions",
  description:
    "Get a relative download link for transaction export. Format can be excel or pdf.",
  parameters: z.object({
    format: z.enum(["excel", "pdf"]).default("excel"),
    tf: z.enum(["today", "month", "year", "custom"]).default("month"),
    from: z.string().optional(),
    to: z.string().optional(),
    m: z.string().optional(),
  }),
  async execute(input) {
    const params = new URLSearchParams();
    params.set("format", input.format);
    params.set("tf", input.tf);
    if (input.from) params.set("from", input.from);
    if (input.to) params.set("to", input.to);
    if (input.m) params.set("m", input.m);
    return {
      href: `/api/export/transactions?${params.toString()}`,
      method: "GET",
    };
  },
});

export function createCazuraAgent(defaultModel = "gpt-4.1-mini") {
  return new Agent<CazuraAgentContext>({
    name: "Cazura AI Assistant",
    model: defaultModel,
    instructions: readToolInstruction,
    tools: [
      listTransactionsTool,
      transactionSummaryTool,
      listCategoriesTool,
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
