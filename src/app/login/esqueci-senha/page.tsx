import { AuthPublicShell } from "@/components/auth/auth-public-shell";
import { ForgotPasswordForm } from "@/components/auth/password-reset-screen";

export const metadata = {
  title: "Esqueci a senha — Biblioteca",
};

export default function EsqueciSenhaPage() {
  return (
    <AuthPublicShell closeHref="/login" closeLabel="Voltar ao login">
      <ForgotPasswordForm />
    </AuthPublicShell>
  );
}
