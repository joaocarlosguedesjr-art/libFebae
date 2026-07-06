import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DesktopNav, MobileNav, TabletNav } from "@/components/navigation";
import { SessionProvider } from "next-auth/react";
import { userNeedsConsent } from "@/lib/lgpd";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const needsConsent = await userNeedsConsent(session.user.id);
  if (needsConsent) {
    redirect("/privacidade/aceite");
  }

  const role = session.user.role;

  return (
    <SessionProvider session={session}>
      <div className="flex min-h-screen bg-slate-50">
        <DesktopNav role={role} />
        <div className="flex min-h-screen flex-1 flex-col">
          {/* Header: só no mobile */}
          <header className="sticky top-0 z-20 border-b border-slate-200 bg-white px-4 py-3 md:hidden">
            <h1 className="text-lg font-bold text-brand-800">Biblioteca</h1>
            <p className="text-sm text-slate-500">{session.user.name}</p>
          </header>

          {/* Header: tablet */}
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
    </SessionProvider>
  );
}
