"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { KeyRound, Mail, Shield, X } from "lucide-react";
import { OtpInput } from "@/components/auth/otp-input";
import { apiPost } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  passwordResetCompleteSchema,
  passwordResetRequestSchema,
  type PasswordResetCompleteInput,
  type PasswordResetRequestInput,
} from "@/lib/validations";

export function ForgotPasswordForm() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PasswordResetRequestInput>({
    resolver: zodResolver(passwordResetRequestSchema),
  });

  async function onSubmit(data: PasswordResetRequestInput) {
    setSubmitting(true);
    const { data: result, error } = await apiPost<{
      message: string;
      verificationId: string | null;
      emailMasked: string;
    }>("/api/password-reset/send", { email: data.email });
    setSubmitting(false);

    if (error) {
      toast.error(error);
      return;
    }

    toast.success(result?.message ?? "Verifique seu e-mail");

    if (result?.verificationId) {
      const params = new URLSearchParams({
        id: result.verificationId,
        email: result.emailMasked,
      });
      router.push(`/login/redefinir-senha/verificar?${params}`);
      return;
    }

    router.push("/login");
  }

  return (
    <div className="w-full max-w-md">
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold text-slate-900">Esqueci a senha</h1>
        <p className="mt-1 text-sm text-slate-500">
          Informe seu e-mail para receber um código de verificação
        </p>
      </div>

      <div className="relative">
        <Link
          href="/login"
          className="absolute -right-2 -top-2 z-10 flex h-10 w-10 items-center justify-center rounded-full border border-brand-200 bg-white text-slate-500 shadow-md transition hover:bg-brand-50 hover:text-brand-800"
          aria-label="Voltar ao login"
        >
          <X className="h-5 w-5" />
        </Link>

        <Card className="border-brand-200 shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Mail className="h-5 w-5 text-brand-700" />
              Recuperar acesso
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">E-mail cadastrado</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  inputMode="email"
                  {...register("email")}
                />
                {errors.email && (
                  <p className="text-sm text-red-600">{errors.email.message}</p>
                )}
              </div>
              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? "Enviando..." : "Enviar código"}
              </Button>
            </form>
            <p className="mt-4 text-center text-sm text-slate-500">
              <Link href="/login" className="text-brand-700 hover:underline">
                Voltar ao login
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

type PasswordResetVerifyFormProps = {
  verificationId: string;
  emailMasked: string;
};

export function PasswordResetVerifyForm({
  verificationId,
  emailMasked,
}: PasswordResetVerifyFormProps) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [otp, setOtp] = useState("");
  const [session, setSession] = useState({ verificationId, emailMasked });

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
    const { error } = await apiPost("/api/password-reset/verify", {
      verificationId: session.verificationId,
      code: otp,
    });
    setSubmitting(false);

    if (error) {
      toast.error(error);
      return;
    }

    toast.success("Código confirmado!");
    const params = new URLSearchParams({
      id: session.verificationId,
      email: session.emailMasked,
    });
    router.push(`/login/redefinir-senha?${params}`);
  }

  async function resendCode() {
    setSubmitting(true);
    const { data: result, error } = await apiPost<{
      verificationId: string;
      emailMasked: string;
    }>("/api/password-reset/resend", { verificationId: session.verificationId });
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
    router.replace(`/login/redefinir-senha/verificar?${params}`);
  }

  return (
    <div className="w-full max-w-md">
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold text-slate-900">Verificar código</h1>
        <p className="mt-1 text-sm text-slate-500">
          Confirme o código enviado para redefinir sua senha
        </p>
      </div>

      <div className="relative">
        <Link
          href="/login/esqueci-senha"
          className="absolute -right-2 -top-2 z-10 flex h-10 w-10 items-center justify-center rounded-full border border-brand-200 bg-white text-slate-500 shadow-md transition hover:bg-brand-50 hover:text-brand-800"
          aria-label="Voltar"
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
                {submitting ? "Verificando..." : "Confirmar código"}
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
              <Link href="/login/esqueci-senha" className="text-slate-500 hover:underline">
                Usar outro e-mail
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export function PasswordResetVerifyPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const verificationId = searchParams.get("id")?.trim() ?? "";
  const emailMasked = searchParams.get("email")?.trim() ?? "";

  useEffect(() => {
    if (!verificationId) {
      router.replace("/login/esqueci-senha");
    }
  }, [verificationId, router]);

  if (!verificationId) {
    return <p className="text-center text-sm text-slate-500">Redirecionando…</p>;
  }

  return (
    <PasswordResetVerifyForm
      verificationId={verificationId}
      emailMasked={emailMasked || "***@***"}
    />
  );
}

type PasswordResetNewPasswordFormProps = {
  verificationId: string;
  emailMasked: string;
};

export function PasswordResetNewPasswordForm({
  verificationId,
  emailMasked,
}: PasswordResetNewPasswordFormProps) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PasswordResetCompleteInput>({
    resolver: zodResolver(passwordResetCompleteSchema),
    defaultValues: { verificationId },
  });

  async function onSubmit(data: PasswordResetCompleteInput) {
    setSubmitting(true);
    const { error } = await apiPost("/api/password-reset/complete", {
      verificationId: data.verificationId,
      password: data.password,
      confirmPassword: data.confirmPassword,
    });
    setSubmitting(false);

    if (error) {
      toast.error(error);
      return;
    }

    toast.success("Senha redefinida com sucesso!");
    router.push("/login?senha=redefinida");
    router.refresh();
  }

  return (
    <div className="w-full max-w-md">
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold text-slate-900">Nova senha</h1>
        <p className="mt-1 text-sm text-slate-500">
          Defina uma nova senha para <strong>{emailMasked}</strong>
        </p>
      </div>

      <div className="relative">
        <Link
          href="/login"
          className="absolute -right-2 -top-2 z-10 flex h-10 w-10 items-center justify-center rounded-full border border-brand-200 bg-white text-slate-500 shadow-md transition hover:bg-brand-50 hover:text-brand-800"
          aria-label="Cancelar"
        >
          <X className="h-5 w-5" />
        </Link>

        <Card className="border-brand-200 shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <KeyRound className="h-5 w-5 text-brand-700" />
              Redefinir senha
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <input type="hidden" {...register("verificationId")} />
              <div className="space-y-2">
                <Label htmlFor="password">Nova senha</Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="new-password"
                  {...register("password")}
                />
                {errors.password && (
                  <p className="text-sm text-red-600">{errors.password.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar senha</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  {...register("confirmPassword")}
                />
                {errors.confirmPassword && (
                  <p className="text-sm text-red-600">{errors.confirmPassword.message}</p>
                )}
              </div>
              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? "Salvando..." : "Salvar nova senha"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export function PasswordResetPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const verificationId = searchParams.get("id")?.trim() ?? "";
  const emailMasked = searchParams.get("email")?.trim() ?? "";

  useEffect(() => {
    if (!verificationId) {
      router.replace("/login/esqueci-senha");
    }
  }, [verificationId, router]);

  if (!verificationId) {
    return <p className="text-center text-sm text-slate-500">Redirecionando…</p>;
  }

  return (
    <PasswordResetNewPasswordForm
      verificationId={verificationId}
      emailMasked={emailMasked || "***@***"}
    />
  );
}
