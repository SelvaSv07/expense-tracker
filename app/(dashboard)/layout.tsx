import { AppShell } from "@/components/dashboard/app-shell";
import { ensureUserBootstrap } from "@/lib/bootstrap";
import { listWallets } from "@/lib/queries";
import { getSession } from "@/lib/session";
import { resolveWalletId } from "@/lib/wallet-server";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await getSession();
  if (!session?.user) {
    redirect("/sign-in");
  }

  await ensureUserBootstrap(session.user.id);
  const wallets = await listWallets(session.user.id);
  const activeWalletId = await resolveWalletId(session.user.id);

  return (
    <AppShell
      user={{
        name: session.user.name,
        email: session.user.email,
        image: session.user.image,
      }}
      wallets={wallets.map((w) => ({
        id: w.id,
        name: w.name,
        currency: w.currency,
        isDefault: w.isDefault,
      }))}
      activeWalletId={activeWalletId}
    >
      {children}
    </AppShell>
  );
}
