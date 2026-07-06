"use client";

import Link from "next/link";
import { InstitutionLogoLink } from "@/components/institution/institution-logo-link";
import { BookAssistant } from "@/components/chat/book-assistant";
import { PublicFooter } from "@/components/legal/public-footer";

type AuthPublicShellProps = {
  children: React.ReactNode;
  closeHref?: string;
  closeLabel?: string;
};

export function AuthPublicShell({
  children,
  closeHref = "/catalogo",
  closeLabel = "Voltar ao catálogo",
}: AuthPublicShellProps) {
  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-brand-50 to-[var(--background)]">
      <header className="border-b border-brand-200 bg-brand-header px-4 py-4">
        <div className="mx-auto flex max-w-lg justify-center">
          <InstitutionLogoLink />
        </div>
      </header>
      <main className="flex flex-1 flex-col items-center px-4 py-8 pb-24">{children}</main>
      <PublicFooter />
      <BookAssistant />
      <span className="sr-only">
        <Link href={closeHref}>{closeLabel}</Link>
      </span>
    </div>
  );
}
