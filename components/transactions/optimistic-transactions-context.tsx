"use client";

import type { ActivityRow } from "@/components/transactions/activity-row";
import {
  createContext,
  useContext,
  useMemo,
  useOptimistic,
  type ReactNode,
} from "react";

export type OptimisticAction =
  | { type: "prepend"; row: ActivityRow }
  | { type: "remove"; id: string }
  | { type: "restore"; row: ActivityRow };

function applyOptimisticReducer(
  state: ActivityRow[],
  action: OptimisticAction,
): ActivityRow[] {
  switch (action.type) {
    case "prepend":
      return [action.row, ...state];
    case "remove":
      return state.filter((r) => r.id !== action.id);
    case "restore": {
      const next = [...state, action.row];
      next.sort(
        (a, b) =>
          new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime(),
      );
      return next;
    }
    default:
      return state;
  }
}

type OptimisticTransactionsContextValue = {
  displayRows: ActivityRow[];
  applyOptimistic: (action: OptimisticAction) => void;
};

const OptimisticTransactionsContext =
  createContext<OptimisticTransactionsContextValue | null>(null);

export function OptimisticTransactionsProvider({
  initialRows,
  children,
}: {
  initialRows: ActivityRow[];
  children: ReactNode;
}) {
  const [displayRows, applyOptimistic] = useOptimistic(
    initialRows,
    applyOptimisticReducer,
  );

  const value = useMemo(
    () => ({
      displayRows,
      applyOptimistic,
    }),
    [displayRows, applyOptimistic],
  );

  return (
    <OptimisticTransactionsContext.Provider value={value}>
      {children}
    </OptimisticTransactionsContext.Provider>
  );
}

export function useOptimisticTransactions(): OptimisticTransactionsContextValue {
  const ctx = useContext(OptimisticTransactionsContext);
  if (!ctx) {
    throw new Error(
      "useOptimisticTransactions must be used within OptimisticTransactionsProvider",
    );
  }
  return ctx;
}

export function useOptimisticTransactionsOptional(): OptimisticTransactionsContextValue | null {
  return useContext(OptimisticTransactionsContext);
}
