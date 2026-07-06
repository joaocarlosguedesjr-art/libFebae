import Link from "next/link";
import { InstitutionLogoLink } from "@/components/institution/institution-logo-link";
import { BookAssistant } from "@/components/chat/book-assistant";
import { PublicFooter } from "@/components/legal/public-footer";
import type { LegalConfig } from "@/lib/app-settings.types";

type LegalPageLayoutProps = {
  title: string;
  version: string;
  updatedAt: string;
  config: LegalConfig;
  children: React.ReactNode;
};

export function LegalPageLayout({
  title,
  version,
  updatedAt,
  config,
  children,
}: LegalPageLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col bg-[var(--background)]">
      <header className="border-b border-brand-200 bg-brand-header">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-4 py-4">
          <InstitutionLogoLink size="sm" />
          <Link href="/login" className="text-sm text-slate-600 hover:text-brand-700">
            Entrar
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8">
        <p className="text-sm text-slate-500">{config.institutionName}</p>
        <h1 className="mt-1 text-3xl font-bold text-slate-900">{title}</h1>
        <p className="mt-2 text-sm text-slate-500">
          Versão {version} · Atualizado em {updatedAt}
        </p>
        <article className="prose prose-slate mt-8 max-w-none prose-headings:text-slate-900 prose-p:text-slate-700 prose-li:text-slate-700">
          {children}
        </article>
      </main>

      <PublicFooter />
      <BookAssistant />
    </div>
  );
}
