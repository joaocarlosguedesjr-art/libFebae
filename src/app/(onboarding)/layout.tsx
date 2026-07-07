"use client";

import { useRouter } from "next/navigation";
import { useSession, SessionProvider } from "next-auth/react";

function OnboardingFrame({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { status } = useSession({
    required: true,
    onUnauthenticated() {
      router.replace("/login");
    },
  });

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-slate-500">
        Carregando…
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-brand-50 to-[var(--background)]">
      {children}
    </div>
  );
}

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SessionProvider>
      <OnboardingFrame>{children}</OnboardingFrame>
    </SessionProvider>
  );
}
