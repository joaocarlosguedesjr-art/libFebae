import { Suspense } from "react";
import { EmailVerificationPage } from "@/components/auth/email-verification-screen";
import { PageHeader } from "@/components/responsive/page-header";

export const metadata = {
  title: "Verificar e-mail — Novo usuário",
};

export default function NovoUsuarioVerificarPage() {
  return (
    <div className="mx-auto max-w-lg space-y-6">
      <PageHeader title="Verificar e-mail" description="Confirme o código enviado por e-mail" />
      <Suspense
        fallback={<p className="text-center text-sm text-slate-500">Carregando…</p>}
      >
        <EmailVerificationPage mode="admin" />
      </Suspense>
    </div>
  );
}
