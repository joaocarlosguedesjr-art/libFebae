import { Suspense } from "react";
import { AuthPublicShell } from "@/components/auth/auth-public-shell";
import { EmailVerificationPage } from "@/components/auth/email-verification-screen";

export const metadata = {
  title: "Verificar e-mail — Biblioteca",
};

export default function CadastroVerificarPage() {
  return (
    <AuthPublicShell>
      <Suspense
        fallback={<p className="text-center text-sm text-slate-500">Carregando…</p>}
      >
        <EmailVerificationPage mode="public" />
      </Suspense>
    </AuthPublicShell>
  );
}
