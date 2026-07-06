import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { SessionProvider } from "next-auth/react";

export default async function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <SessionProvider session={session}>
      <div className="min-h-screen bg-gradient-to-b from-brand-50 to-[var(--background)]">
        {children}
      </div>
    </SessionProvider>
  );
}
