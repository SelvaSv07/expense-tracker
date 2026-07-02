import { OverviewAddTransactionTrigger } from "@/components/overview/overview-add-transaction-trigger";
import type {
  PaymentMethodOption,
  TransactionCategoryOption,
} from "@/components/transactions/add-transaction-dialog";
import { formatInr } from "@/lib/money";
import { ChevronRight } from "lucide-react";

function AddAction({
  categories,
  paymentMethods,
}: {
  categories: TransactionCategoryOption[];
  paymentMethods: PaymentMethodOption[];
}) {
  return (
    <OverviewAddTransactionTrigger
      categories={categories}
      paymentMethods={paymentMethods}
    />
  );
}

export function OverviewBalanceBanner({
  balance,
  todaySpend,
  categories,
  paymentMethods,
}: {
  balance: number;
  todaySpend: number;
  categories: TransactionCategoryOption[];
  paymentMethods: PaymentMethodOption[];
}) {
  return (
    <div
      className="relative overflow-hidden rounded-xl px-4 py-3.5"
      style={{
        backgroundImage:
          "linear-gradient(154.72deg, #ecf4ec 50%, #dbecdc 100%)",
      }}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage:
            "radial-gradient(ellipse 80% 120% at 100% 0%, rgba(59,96,100,0.12), transparent 55%)",
        }}
      />

      <div className="relative flex items-end justify-between gap-3">
        <div className="flex min-w-0 flex-1 flex-col gap-1.5 sm:flex-row sm:flex-wrap sm:items-end sm:gap-3 md:gap-4">
          <div className="min-w-0">
            <p
              className="text-[13px] leading-none font-medium"
              style={{ color: "var(--cazura-label)" }}
            >
              Total balance
            </p>
            <div className="mt-1 flex items-center justify-between gap-3 sm:block">
              <p
                className="min-w-0 text-[24px] leading-none font-bold sm:text-[30px]"
                style={{ color: "var(--cazura-teal)" }}
              >
                {formatInr(balance)}
              </p>
              <div className="sm:hidden">
                <AddAction
                  categories={categories}
                  paymentMethods={paymentMethods}
                />
              </div>
            </div>
          </div>
          <div className="flex min-w-0 items-center gap-1">
            <span
              className="text-xs font-medium"
              style={{ color: "var(--cazura-label)" }}
            >
              Today&apos;s spend:
            </span>
            <span
              className="text-[13px] font-bold"
              style={{ color: "var(--cazura-teal-mid)" }}
            >
              {formatInr(todaySpend)}
            </span>
            <ChevronRight
              className="size-[13px] shrink-0"
              strokeWidth={2.5}
              color="var(--cazura-teal-mid)"
            />
          </div>
        </div>

        <div className="hidden shrink-0 sm:flex">
          <AddAction categories={categories} paymentMethods={paymentMethods} />
        </div>
      </div>
    </div>
  );
}
