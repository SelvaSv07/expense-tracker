import { db } from "@/db";
import { categories, transactions } from "@/db/schema";
import { toMcpToolResultEnvelope } from "@/lib/ai/tool-ui";
import type { AssistantToolData } from "@/lib/ai/tool-ui";
import { and, desc, eq, gte, ilike, lte, sql } from "drizzle-orm";

export type ListTransactionsInput = {
  fromIso: string | null;
  toIso: string | null;
  search: string | null;
  limit: number | null;
};

const DEFAULT_LIMIT = 20;

export async function fetchTransactionsRowsForUser(
  userId: string,
  input: ListTransactionsInput,
) {
  const limit = input.limit ?? DEFAULT_LIMIT;
  const where = [eq(transactions.userId, userId)];
  if (input.fromIso) where.push(gte(transactions.occurredAt, new Date(input.fromIso)));
  if (input.toIso) where.push(lte(transactions.occurredAt, new Date(input.toIso)));
  if (input.search && input.search.trim()) {
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
    .limit(limit);

  return rows.map((r) => {
    const note = r.note?.trim() ?? "";
    const transactionName = r.transactionName?.trim() ?? "";
    const nameNote =
      transactionName && note
        ? `${transactionName} / ${note}`
        : transactionName || note || "Untitled";
    const categoryRaw = r.categoryName?.trim();
    const category =
      categoryRaw && categoryRaw.length > 0
        ? categoryRaw
        : r.categoryType
          ? `Uncategorized (${r.categoryType})`
          : "Uncategorized";
    const methodRaw = r.paymentMethod?.trim();
    const method = methodRaw && methodRaw.length > 0 ? methodRaw : "—";
    return {
      id: r.id,
      dateTimeIso: r.occurredAt.toISOString(),
      nameNote,
      category,
      method,
      amountInr: r.amount,
    };
  });
}

export async function listTransactionsToolEnvelopeForUser(
  userId: string,
  input: ListTransactionsInput,
): Promise<Extract<AssistantToolData, { kind: "transaction_list" }>> {
  const mappedRows = await fetchTransactionsRowsForUser(userId, input);
  return toMcpToolResultEnvelope({
    tool: "list_transactions",
    kind: "transaction_list",
    data: { rows: mappedRows },
  }) as Extract<AssistantToolData, { kind: "transaction_list" }>;
}

export function userMessageRequestsTransactionList(text: string): boolean {
  const t = text.trim().toLowerCase();
  if (t.length === 0) return false;
  const patterns = [
    /list\s+(my\s+)?transactions/,
    /show\s+(my\s+)?transactions/,
    /my\s+transactions/,
    /transaction\s+list/,
    /recent\s+transactions/,
    /what\s+are\s+my\s+transactions/,
  ];
  return patterns.some((re) => re.test(t));
}
