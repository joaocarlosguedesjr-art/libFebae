"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";
import { apiPost } from "@/lib/api-client";
import { formatCpfInput, isValidCpf, stripCpf } from "@/lib/cpf";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";

type CreateUserWizardProps = {
  mode: "admin" | "public";
  title?: string;
};

type VerificationSession = {
  verificationId: string;
  emailMasked: string;
};

function verificationRedirectPath(mode: "admin" | "public", session: VerificationSession) {
  const params = new URLSearchParams({
    id: session.verificationId,
    email: session.emailMasked,
  });
  return mode === "admin"
    ? `/usuarios/novo/verificar?${params}`
    : `/cadastro/verificar?${params}`;
}

export function CreateUserWizard({ mode, title }: CreateUserWizardProps) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [dataSubjectInformed, setDataSubjectInformed] = useState(false);
  const [consentConfirmed, setConsentConfirmed] = useState(false);
  const [cpf, setCpf] = useState("");
  const [cpfError, setCpfError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const sendUrl =
    mode === "admin" ? "/api/users/verify-email/send" : "/api/cadastro/send-code";

  function handleCpfChange(value: string) {
    setCpf(formatCpfInput(value));
    if (cpfError) setCpfError(null);
  }

  function validateCpfField(): boolean {
    const digits = stripCpf(cpf);
    if (!digits) {
      setCpfError(null);
      return true;
    }
    if (digits.length < 11) {
      setCpfError("CPF deve ter 11 dígitos");
      return false;
    }
    if (!isValidCpf(digits)) {
      setCpfError("CPF inválido");
      return false;
    }
    setCpfError(null);
    return true;
  }

  async function onSubmitForm(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!dataSubjectInformed || !consentConfirmed) {
      toast.error("Confirme as declarações de consentimento LGPD.");
      return;
    }

    if (!validateCpfField()) {
      return;
    }

    const form = e.currentTarget;
    const formData = new FormData(form);
    const cpfDigits = stripCpf(cpf);

    const body = {
      name: formData.get("name") as string,
      email: formData.get("email") as string,
      cpf: cpfDigits || "",
      password: formData.get("password") as string,
      role: mode === "admin" ? (formData.get("role") as "ADMIN" | "READER") : "READER",
      dataSubjectInformed: true,
      consentConfirmed: true,
    };

    setSubmitting(true);
    const { data: result, error } = await apiPost<VerificationSession & { message?: string }>(
      sendUrl,
      body
    );

    if (error || !result?.verificationId) {
      setSubmitting(false);
      toast.error(error ?? "Não foi possível iniciar o cadastro");
      return;
    }

    const verifyPath = verificationRedirectPath(mode, {
      verificationId: result.verificationId,
      emailMasked: result.emailMasked,
    });

    toast.success("Código enviado! Verifique o e-mail.");
    window.location.assign(verifyPath);
  }

  return (
    <div className="mx-auto max-w-lg space-y-4">
      <h1 className="text-2xl font-bold text-slate-900">
        {title ?? (mode === "admin" ? "Novo usuário" : "Criar conta")}
      </h1>
      <Card>
        <CardHeader>
          <CardTitle>Dados do usuário</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmitForm} className="space-y-4" autoComplete="off">
            <div className="space-y-2">
              <Label htmlFor="name">Nome *</Label>
              <Input id="name" name="name" required autoComplete="name" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">E-mail *</Label>
              <Input
                id="email"
                name="email"
                type="email"
                inputMode="email"
                required
                autoComplete="email"
              />
              <p className="text-xs text-slate-500">
                Enviaremos um código de confirmação para este e-mail. Na próxima tela, informe
                o código para concluir o cadastro.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="cpf">CPF</Label>
              <Input
                id="cpf"
                name="cpf"
                inputMode="numeric"
                value={cpf}
                onChange={(e) => handleCpfChange(e.target.value)}
                onBlur={validateCpfField}
                placeholder="000.000.000-00"
                maxLength={14}
                autoComplete="off"
                aria-invalid={cpfError ? true : undefined}
              />
              {cpfError && <p className="text-sm text-red-600">{cpfError}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha *</Label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={6}
                  autoComplete="new-password"
                  className="pr-11"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-500 hover:text-brand-800"
                  aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>
            {mode === "admin" && (
              <div className="space-y-2">
                <Label htmlFor="role">Perfil</Label>
                <Select id="role" name="role" defaultValue="READER">
                  <option value="READER">Leitor</option>
                  <option value="ADMIN">Bibliotecário (Admin)</option>
                </Select>
              </div>
            )}

            <div className="space-y-3 rounded-lg border border-brand-200 bg-brand-50/50 p-4">
              <p className="text-sm font-medium text-brand-900">Consentimento (LGPD)</p>
              <Checkbox
                id="informed"
                checked={dataSubjectInformed}
                onChange={(e) => setDataSubjectInformed(e.target.checked)}
                label={
                  mode === "admin" ? (
                    "Confirmo que o titular foi informado sobre o tratamento de dados conforme a Política de Privacidade."
                  ) : (
                    <>
                      Li e concordo com a{" "}
                      <Link href="/privacidade" target="_blank" className="text-brand-700 hover:underline">
                        Política de Privacidade
                      </Link>
                      .
                    </>
                  )
                }
              />
              <Checkbox
                id="consent"
                checked={consentConfirmed}
                onChange={(e) => setConsentConfirmed(e.target.checked)}
                label={
                  mode === "admin" ? (
                    "Confirmo o consentimento do titular para cadastro na biblioteca."
                  ) : (
                    <>
                      Li e concordo com os{" "}
                      <Link href="/termos" target="_blank" className="text-brand-700 hover:underline">
                        Termos de Uso
                      </Link>
                      .
                    </>
                  )
                }
              />
            </div>

            <div className="flex gap-3">
              {mode === "admin" ? (
                <Button type="button" variant="outline" onClick={() => router.back()}>
                  Cancelar
                </Button>
              ) : (
                <Link href="/login" className="flex-1">
                  <Button type="button" variant="outline" className="w-full">
                    Voltar
                  </Button>
                </Link>
              )}
              <Button type="submit" disabled={submitting} className="flex-1">
                {submitting ? "Criando usuário..." : "Criar usuário"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
