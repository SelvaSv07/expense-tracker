/** Row shape for the transactions activity table (server + optimistic client rows). */
export type ActivityRow = {
  id: string;
  amount: number;
  occurredAt: string;
  transactionName: string | null;
  note: string | null;
  paymentMethod: string | null;
  categoryName: string;
  categoryType: "income" | "expense";
  categoryIcon: string | null;
  categoryColor: string;
  /** True while the row is shown optimistically before the server confirms. */
  optimistic?: boolean;
};
