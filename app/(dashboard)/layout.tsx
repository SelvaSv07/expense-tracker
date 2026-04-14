import { AppShell } from "@/components/dashboard/app-shell";
import { ensureUserBootstrap } from "@/lib/bootstrap";
import { getSession } from "@/lib/session";
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

  return (
    <AppShell
      user={{
        name: session.user.name,
        email: session.user.email,
        image: session.user.image,
      }}
    >
      {children}
    </AppShell>
  );
}
