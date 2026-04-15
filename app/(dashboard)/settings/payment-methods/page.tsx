import { PaymentMethodsManager } from "@/components/settings/payment-methods-manager";
import {
  getPaymentMethodUsageByName,
  listPaymentMethods,
} from "@/lib/queries";
import { getSession } from "@/lib/session";
import { ChevronLeft, CreditCard } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function SettingsPaymentMethodsPage() {
  const session = await getSession();
  if (!session?.user) redirect("/sign-in");

  const [methods, usageByName] = await Promise.all([
    listPaymentMethods(session.user.id),
    getPaymentMethodUsageByName(session.user.id),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <Link
          href="/settings"
          className="text-muted-foreground hover:text-foreground mb-4 inline-flex items-center gap-1 text-sm font-medium"
        >
          <ChevronLeft className="size-4" />
          Settings
        </Link>
        <div className="flex items-start gap-3">
          <div
            className="flex size-10 shrink-0 items-center justify-center rounded-lg border"
            style={{
              background: "var(--cazura-canvas)",
              borderColor: "var(--cazura-border)",
            }}
          >
            <CreditCard
              className="size-5 text-[var(--cazura-muted)]"
              strokeWidth={1.8}
            />
          </div>
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">
              Payment methods
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Define how you paid—cash, card, UPI, and any custom labels. These
              appear in the add-transaction form and in your activity table.
            </p>
          </div>
        </div>
      </div>

      <PaymentMethodsManager
        methods={methods.map((m) => ({
          id: m.id,
          name: m.name,
          sortOrder: m.sortOrder,
        }))}
        usageByName={usageByName}
      />
    </div>
  );
}
