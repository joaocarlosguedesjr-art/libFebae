import { Suspense } from "react";
import { AuthPublicShell } from "@/components/auth/auth-public-shell";
import { PasswordResetPage } from "@/components/auth/password-reset-screen";

export const metadata = {
  title: "Nova senha — Biblioteca",
};

export default function RedefinirSenhaPage() {
  return (
    <AuthPublicShell closeHref="/login" closeLabel="Voltar ao login">
      <Suspense
        fallback={<p className="text-center text-sm text-slate-500">Carregando…</p>}
      >
        <PasswordResetPage />
      </Suspense>
    </AuthPublicShell>
  );
}
