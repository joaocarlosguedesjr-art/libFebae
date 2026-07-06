"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BookOpen } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";

export default function AceitePrivacidadePage() {
  const router = useRouter();
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!acceptedPrivacy || !acceptedTerms) {
      toast.error("É necessário aceitar a Política de Privacidade e os Termos de Uso.");
      return;
    }

    setSubmitting(true);
    const res = await fetch("/api/privacy/accept", { method: "POST" });
    setSubmitting(false);

    if (!res.ok) {
      const err = await res.json();
      toast.error(err.error ?? "Não foi possível registrar o aceite.");
      return;
    }

    toast.success("Aceite registrado com sucesso.");
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-lg flex-col justify-center p-4">
      <div className="mb-6 flex flex-col items-center text-center">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-700 text-white">
          <BookOpen className="h-7 w-7" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900">Termos e privacidade</h1>
        <p className="mt-2 text-sm text-slate-600">
          Para continuar, leia e aceite os documentos abaixo. Seu aceite será registrado
          com data e versão, conforme a LGPD.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Confirmação de leitura e aceite</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-5">
            <Checkbox
              id="privacy"
              checked={acceptedPrivacy}
              onChange={(e) => setAcceptedPrivacy(e.target.checked)}
              label={
                <>
                  Li e concordo com a{" "}
                  <Link
                    href="/privacidade"
                    target="_blank"
                    className="font-medium text-brand-700 hover:underline"
                  >
                    Política de Privacidade
                  </Link>
                  .
                </>
              }
            />
            <Checkbox
              id="terms"
              checked={acceptedTerms}
              onChange={(e) => setAcceptedTerms(e.target.checked)}
              label={
                <>
                  Li e concordo com os{" "}
                  <Link
                    href="/termos"
                    target="_blank"
                    className="font-medium text-brand-700 hover:underline"
                  >
                    Termos de Uso
                  </Link>
                  .
                </>
              }
            />
            <p className="text-xs text-slate-500">
              Você pode exercer seus direitos como titular de dados a qualquer momento em
              Meus dados, após o acesso ao sistema.
            </p>
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? "Registrando..." : "Aceitar e continuar"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
