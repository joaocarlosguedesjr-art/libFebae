"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession, SessionProvider } from "next-auth/react";
import { DesktopNav, MobileNav, TabletNav } from "@/components/navigation";

function DashboardFrame({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { data: session, status } = useSession({
    required: true,
    onUnauthenticated() {
      router.replace("/login");
    },
  });

  useEffect(() => {
    if (status !== "authenticated") return;

    let cancelled = false;

    async function checkConsent() {
      const res = await fetch("/api/users/me");
      if (!res.ok || cancelled) return;

      const user = (await res.json()) as { consentValid?: boolean };
      if (user.consentValid === false) {
        router.replace("/privacidade/aceite");
      }
    }

    void checkConsent();
    return () => {
      cancelled = true;
    };
  }, [status, router]);

  if (status === "loading" || !session?.user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 text-sm text-slate-500">
        Carregando…
      </div>
    );
  }

  const role = session.user.role;

  return (
    <div className="flex min-h-screen bg-slate-50">
      <DesktopNav role={role} />
      <div className="flex min-h-screen flex-1 flex-col">
        <header className="sticky top-0 z-20 border-b border-slate-200 bg-white px-4 py-3 md:hidden">
          <h1 className="text-lg font-bold text-brand-800">Biblioteca</h1>
          <p className="text-sm text-slate-500">{session.user.name}</p>
        </header>

        <header className="sticky top-0 z-20 hidden border-b border-slate-200 bg-white px-6 py-4 md:block lg:hidden">
          <h1 className="text-lg font-bold text-brand-800">Biblioteca</h1>
          <p className="text-sm text-slate-500">{session.user.name}</p>
        </header>

        <TabletNav role={role} />

        <main className="flex-1 overflow-y-auto p-4 pb-24 md:p-6 md:pb-6 lg:p-8 lg:pb-8">
          {children}
        </main>

        <MobileNav role={role} />
      </div>
    </div>
  );
}

export function DashboardLayoutShell({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <DashboardFrame>{children}</DashboardFrame>
    </SessionProvider>
  );
}
