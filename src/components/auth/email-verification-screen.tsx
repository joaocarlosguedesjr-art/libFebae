"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Mail, Shield, X } from "lucide-react";
import { OtpInput } from "@/components/auth/otp-input";
import { apiPost } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type EmailVerificationFormProps = {
  mode: "admin" | "public";
  verificationId: string;
  emailMasked: string;
  backHref: string;
  closeHref: string;
  closeLabel: string;
  showHeading?: boolean;
};

export function EmailVerificationForm({
  mode,
  verificationId,
  emailMasked,
  backHref,
  closeHref,
  closeLabel,
  showHeading = true,
}: EmailVerificationFormProps) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [otp, setOtp] = useState("");
  const [session, setSession] = useState({ verificationId, emailMasked });

  const confirmUrl =
    mode === "admin" ? "/api/users/verify-email/confirm" : "/api/cadastro/confirm";
  const resendUrl =
    mode === "admin" ? "/api/users/verify-email/resend" : "/api/cadastro/resend-code";

  useEffect(() => {
    setSession({ verificationId, emailMasked });
    setOtp("");
  }, [verificationId, emailMasked]);

  async function onConfirmOtp(e: React.FormEvent) {
    e.preventDefault();

    if (otp.length !== 6) {
      toast.error("Informe o código de 6 dígitos");
      return;
    }

    setSubmitting(true);
    const { data, error, status } = await apiPost<{
      pendingApproval?: boolean;
      message?: string;
    }>(confirmUrl, {
      verificationId: session.verificationId,
      code: otp,
    });
    setSubmitting(false);

    if (error) {
      toast.error(error);
      return;
    }

    if (status === 202 || data?.pendingApproval) {
      toast.success(data?.message ?? "Cadastro enviado para aprovação do administrador.");
      router.push("/usuarios");
      router.refresh();
      return;
    }

    toast.success("Conta confirmada com sucesso!");

    if (mode === "admin") {
      router.push("/usuarios");
    } else {
      router.push("/login?cadastro=ok");
    }
    router.refresh();
  }

  async function resendCode() {
    setSubmitting(true);
    const { data: result, error } = await apiPost<{
      verificationId: string;
      emailMasked: string;
    }>(resendUrl, { verificationId: session.verificationId });
    setSubmitting(false);

    if (error || !result) {
      toast.error(error ?? "Erro ao reenviar");
      return;
    }

    setSession({
      verificationId: result.verificationId,
      emailMasked: result.emailMasked,
    });
    setOtp("");
    toast.success("Novo código enviado.");

    const params = new URLSearchParams({
      id: result.verificationId,
      email: result.emailMasked,
    });
    router.replace(
      mode === "admin"
        ? `/usuarios/novo/verificar?${params}`
        : `/cadastro/verificar?${params}`
    );
  }

  return (
    <div className="w-full max-w-md">
      {showHeading && (
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-slate-900">Verificar e-mail</h1>
          <p className="mt-1 text-sm text-slate-500">
            Confirme o código enviado para concluir o cadastro
          </p>
        </div>
      )}

      <div className="relative">
        <Link
          href={closeHref}
          className="absolute -right-2 -top-2 z-10 flex h-10 w-10 items-center justify-center rounded-full border border-brand-200 bg-white text-slate-500 shadow-md transition hover:bg-brand-50 hover:text-brand-800"
          aria-label={closeLabel}
        >
          <X className="h-5 w-5" />
        </Link>

        <Card className="border-brand-200 shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Mail className="h-5 w-5 text-brand-700" />
              Código de 6 dígitos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-2 text-sm text-slate-600">
              Enviamos um código para{" "}
              <strong className="text-slate-900">{session.emailMasked}</strong>.
            </p>
            <p className="mb-6 flex items-center gap-1.5 text-xs text-slate-500">
              <Shield className="h-3.5 w-3.5 shrink-0" />
              O código é gerado e validado apenas no servidor.
            </p>
            <form onSubmit={onConfirmOtp} className="space-y-6">
              <OtpInput value={otp} onChange={setOtp} disabled={submitting} />
              <Button type="submit" className="w-full" disabled={submitting || otp.length !== 6}>
                {submitting ? "Confirmando..." : "Confirmar cadastro"}
              </Button>
            </form>
            <div className="mt-4 flex flex-col gap-2 text-center text-sm">
              <button
                type="button"
                onClick={resendCode}
                disabled={submitting}
                className="text-brand-700 hover:underline disabled:opacity-50"
              >
                Reenviar código
              </button>
              <Link href={backHref} className="text-slate-500 hover:underline">
                Alterar dados do cadastro
              </Link>
            </div>
          </CardContent>
        </Card>

        {mode === "public" && (
          <p className="mt-4 text-center text-sm text-slate-500">
            <Link href="/catalogo?assistente=1" className="text-brand-700 hover:underline">
              Consultar catálogo público
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}

export function EmailVerificationPage({ mode }: { mode: "admin" | "public" }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const verificationId = searchParams.get("id")?.trim() ?? "";
  const emailMasked = searchParams.get("email")?.trim() ?? "";

  useEffect(() => {
    if (!verificationId) {
      router.replace(mode === "admin" ? "/usuarios/novo" : "/cadastro");
    }
  }, [verificationId, mode, router]);

  if (!verificationId) {
    return (
      <p className="text-center text-sm text-slate-500">Redirecionando…</p>
    );
  }

  const backHref = mode === "admin" ? "/usuarios/novo" : "/cadastro";
  const closeHref = mode === "admin" ? "/usuarios" : "/catalogo";
  const closeLabel = mode === "admin" ? "Voltar à lista de usuários" : "Voltar ao catálogo";

  return (
    <EmailVerificationForm
      mode={mode}
      verificationId={verificationId}
      emailMasked={emailMasked || "***@***"}
      backHref={backHref}
      closeHref={closeHref}
      closeLabel={closeLabel}
      showHeading={mode === "public"}
    />
  );
}
