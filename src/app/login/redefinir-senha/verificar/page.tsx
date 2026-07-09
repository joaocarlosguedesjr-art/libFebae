import { Suspense } from "react";
import { AuthPublicShell } from "@/components/auth/auth-public-shell";
import { PasswordResetVerifyPage } from "@/components/auth/password-reset-screen";

export const metadata = {
  title: "Verificar código — Biblioteca",
};

export default function RedefinirSenhaVerificarPage() {
  return (
    <AuthPublicShell closeHref="/login" closeLabel="Voltar ao login">
      <Suspense
        fallback={<p className="text-center text-sm text-slate-500">Carregando…</p>}
      >
        <PasswordResetVerifyPage />
      </Suspense>
    </AuthPublicShell>
  );
}
