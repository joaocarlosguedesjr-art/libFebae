"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ExternalLink, Shield } from "lucide-react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/responsive/page-header";
import { isAdmin } from "@/lib/roles";
import { handleStaffMutationResponse } from "@/lib/staff-mutation";

type Settings = {
  loanDaysDefault: number;
  institutionName: string;
  institutionAddress: string | null;
  institutionEmail: string;
  dpoName: string | null;
  dpoEmail: string;
  privacyPolicyVersion: string;
  termsVersion: string;
  institutionLogoUrl: string;
  librarianRequiresApproval: boolean;
};

const emptySettings: Settings = {
  loanDaysDefault: 14,
  institutionName: "",
  institutionAddress: "",
  institutionEmail: "",
  dpoName: "",
  dpoEmail: "",
  privacyPolicyVersion: "1.0",
  termsVersion: "1.0",
  institutionLogoUrl: "/feabe-logo.jpeg",
  librarianRequiresApproval: true,
};

export default function ConfiguracoesPage() {
  const { data: session } = useSession();
  const [settings, setSettings] = useState<Settings>(emptySettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const isAdminUser = isAdmin(session?.user?.role);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const res = await fetch("/api/settings");
      if (res.ok) {
        const data = await res.json();
        setSettings({
          ...data,
          institutionAddress: data.institutionAddress ?? "",
          dpoName: data.dpoName ?? "",
          librarianRequiresApproval: data.librarianRequiresApproval ?? true,
        });
      }
      setLoading(false);
    }
    load();
  }, []);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);

    const res = await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings),
    });

    setSaving(false);

    const result = await handleStaffMutationResponse(res, "Configurações salvas.");
    if (!result.ok) return;

    if (result.pending) return;

    const data = result.data as Settings;
    setSettings({
      ...data,
      institutionAddress: data.institutionAddress ?? "",
      dpoName: data.dpoName ?? "",
    });
  }

  function updateField<K extends keyof Settings>(key: K, value: Settings[K]) {
    setSettings((prev) => ({ ...prev, [key]: value }));
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl space-y-4">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader
        title="Configurações"
        description="Instituição, LGPD e parâmetros da biblioteca"
      />

      <Card className="border-brand-200 bg-brand-50/40">
        <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <Shield className="mt-0.5 h-5 w-5 shrink-0 text-brand-700" />
            <div>
              <p className="font-medium text-brand-900">Solicitações LGPD</p>
              <p className="text-sm text-brand-800">
                Atenda pedidos dos titulares de dados.
              </p>
            </div>
          </div>
          <Link href="/lgpd/solicitacoes">
            <Button variant="outline" size="sm" className="w-full sm:w-auto">
              Ver solicitações
            </Button>
          </Link>
        </CardContent>
      </Card>

      <form onSubmit={onSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Instituição</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="institutionName">Nome do centro *</Label>
              <Input
                id="institutionName"
                value={settings.institutionName}
                onChange={(e) => updateField("institutionName", e.target.value)}
                required
                placeholder="Ex.: Centro Espírita Paz e Amor"
              />
              <p className="text-xs text-slate-500">
                Exibido na Política de Privacidade e Termos de Uso.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="institutionLogoUrl">Logo institucional (caminho público)</Label>
              <Input
                id="institutionLogoUrl"
                value={settings.institutionLogoUrl}
                onChange={(e) => updateField("institutionLogoUrl", e.target.value)}
                placeholder="/feabe-logo.jpeg"
                required
              />
              <p className="text-xs text-slate-500">
                Arquivo em <code className="text-xs">public/</code>. A logo funciona como botão
                que leva à consulta do catálogo e aparece nos e-mails de verificação.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="institutionAddress">Endereço</Label>
              <Textarea
                id="institutionAddress"
                value={settings.institutionAddress ?? ""}
                onChange={(e) => updateField("institutionAddress", e.target.value)}
                rows={2}
                placeholder="Rua, número, bairro, cidade — UF"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="institutionEmail">E-mail institucional *</Label>
              <Input
                id="institutionEmail"
                type="email"
                value={settings.institutionEmail}
                onChange={(e) => updateField("institutionEmail", e.target.value)}
                required
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Encarregado de dados (LGPD)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="dpoName">Nome do encarregado</Label>
              <Input
                id="dpoName"
                value={settings.dpoName ?? ""}
                onChange={(e) => updateField("dpoName", e.target.value)}
                placeholder="Opcional"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dpoEmail">E-mail do encarregado *</Label>
              <Input
                id="dpoEmail"
                type="email"
                value={settings.dpoEmail}
                onChange={(e) => updateField("dpoEmail", e.target.value)}
                required
              />
              <p className="text-xs text-slate-500">
                Canal para exercício de direitos previstos na LGPD.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Empréstimos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="loanDaysDefault">Prazo padrão (dias) *</Label>
              <Input
                id="loanDaysDefault"
                type="number"
                min={1}
                max={90}
                value={settings.loanDaysDefault}
                onChange={(e) =>
                  updateField("loanDaysDefault", parseInt(e.target.value, 10) || 14)
                }
                required
              />
              <p className="text-xs text-slate-500">
                Usado ao registrar novo empréstimo sem data personalizada.
              </p>
            </div>
          </CardContent>
        </Card>

        {isAdminUser && (
          <Card>
            <CardHeader>
              <CardTitle>Bibliotecário</CardTitle>
            </CardHeader>
            <CardContent>
              <label className="flex cursor-pointer items-start gap-3">
                <Checkbox
                  id="librarianRequiresApproval"
                  checked={settings.librarianRequiresApproval}
                  onChange={(e) =>
                    updateField("librarianRequiresApproval", e.target.checked)
                  }
                />
                <div>
                  <p className="font-medium text-slate-900">Exigir aprovação do administrador</p>
                  <p className="text-sm text-slate-500">
                    Quando ativo, ações do bibliotecário (exceto empréstimo direto) passam pela
                    fila de aprovações. Desative para conceder autonomia total.
                  </p>
                </div>
              </label>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Documentos legais</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="privacyPolicyVersion">Versão da Política de Privacidade *</Label>
                <Input
                  id="privacyPolicyVersion"
                  value={settings.privacyPolicyVersion}
                  onChange={(e) => updateField("privacyPolicyVersion", e.target.value)}
                  required
                  placeholder="1.0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="termsVersion">Versão dos Termos de Uso *</Label>
                <Input
                  id="termsVersion"
                  value={settings.termsVersion}
                  onChange={(e) => updateField("termsVersion", e.target.value)}
                  required
                  placeholder="1.0"
                />
              </div>
            </div>
            <p className="rounded-lg bg-amber-50 p-3 text-xs text-amber-900">
              Ao alterar a versão, usuários precisarão aceitar novamente os documentos no
              próximo login. Atualize o texto em{" "}
              <Link href="/privacidade" target="_blank" className="font-medium underline">
                Privacidade
              </Link>{" "}
              e{" "}
              <Link href="/termos" target="_blank" className="font-medium underline">
                Termos
              </Link>{" "}
              antes de incrementar a versão.
            </p>
            <div className="flex flex-wrap gap-3 text-sm">
              <Link
                href="/privacidade"
                target="_blank"
                className="inline-flex items-center gap-1 text-brand-700 hover:underline"
              >
                Ver política <ExternalLink className="h-3.5 w-3.5" />
              </Link>
              <Link
                href="/termos"
                target="_blank"
                className="inline-flex items-center gap-1 text-brand-700 hover:underline"
              >
                Ver termos <ExternalLink className="h-3.5 w-3.5" />
              </Link>
              <Link
                href="/lgpd"
                target="_blank"
                className="inline-flex items-center gap-1 text-brand-700 hover:underline"
              >
                Página LGPD <ExternalLink className="h-3.5 w-3.5" />
              </Link>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" disabled={saving}>
            {saving ? "Salvando..." : "Salvar configurações"}
          </Button>
        </div>
      </form>
    </div>
  );
}
