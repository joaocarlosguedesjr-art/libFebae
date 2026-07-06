"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/responsive/page-header";
import {
  DATA_SUBJECT_REQUEST_LABELS,
  REQUEST_STATUS_LABELS,
} from "@/lib/lgpd.constants";

type MeData = {
  name: string;
  email: string;
  cpfMasked: string;
  cpfFormatted: string | null;
  role: string;
  createdAt: string;
  privacyAcceptedAt: string | null;
  privacyPolicyVersion: string | null;
  termsAcceptedAt: string | null;
  termsVersion: string | null;
  consentValid: boolean;
  legalConfig: { dpoEmail: string };
  loans: Array<{
    id: string;
    loanDate: string;
    dueDate: string;
    returnDate: string | null;
    status: string;
    copy: { code: string; book: { title: string; author: string } };
  }>;
  dataSubjectRequests: Array<{
    id: string;
    type: string;
    status: string;
    description: string | null;
    response: string | null;
    createdAt: string;
  }>;
};

export default function MeusDadosPage() {
  const [data, setData] = useState<MeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [requestType, setRequestType] = useState("ACCESS");
  const [requestDescription, setRequestDescription] = useState("");
  const [submittingRequest, setSubmittingRequest] = useState(false);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/users/me");
    if (res.ok) setData(await res.json());
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function onSaveProfile(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!data) return;

    setSaving(true);
    const form = new FormData(e.currentTarget);
    const res = await fetch("/api/users/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.get("name"),
        email: form.get("email"),
        cpf: (form.get("cpf") as string) || "",
      }),
    });
    setSaving(false);

    if (!res.ok) {
      const err = await res.json();
      toast.error(err.error ?? "Erro ao atualizar dados");
      return;
    }

    toast.success("Dados atualizados.");
    load();
  }

  async function onSubmitRequest(e: React.FormEvent) {
    e.preventDefault();
    setSubmittingRequest(true);

    const res = await fetch("/api/lgpd/requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: requestType, description: requestDescription }),
    });

    setSubmittingRequest(false);

    if (!res.ok) {
      const err = await res.json();
      toast.error(err.error ?? "Erro ao enviar solicitação");
      return;
    }

    toast.success("Solicitação registrada. O bibliotecário responderá em breve.");
    setRequestDescription("");
    load();
  }

  if (loading) {
    return <p className="text-slate-500">Carregando seus dados...</p>;
  }

  if (!data) {
    return <p className="text-red-600">Não foi possível carregar seus dados.</p>;
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader
        title="Meus dados"
        description="Consulte e exerça seus direitos previstos na LGPD."
      />

      <Card>
        <CardHeader>
          <CardTitle>Seus dados cadastrais</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSaveProfile} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome</Label>
              <Input id="name" name="name" defaultValue={data.name} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                name="email"
                type="email"
                defaultValue={data.email}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cpf">CPF</Label>
              <Input
                id="cpf"
                name="cpf"
                defaultValue={data.cpfFormatted?.replace(/\D/g, "") ?? ""}
                inputMode="numeric"
                maxLength={11}
                placeholder={data.cpfMasked !== "—" ? data.cpfMasked : "Opcional"}
              />
              <p className="text-xs text-slate-500">
                Exibido de forma mascarada nas listagens internas quando aplicável.
              </p>
            </div>
            <Button type="submit" disabled={saving}>
              {saving ? "Salvando..." : "Salvar correções"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Consentimento e documentos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-slate-700">
          <p>
            Política de Privacidade:{" "}
            {data.consentValid ? (
              <Badge variant="success">Aceita v{data.privacyPolicyVersion}</Badge>
            ) : (
              <Badge variant="warning">Pendente de aceite</Badge>
            )}
          </p>
          <p>
            Termos de Uso:{" "}
            {data.consentValid ? (
              <Badge variant="success">Aceitos v{data.termsVersion}</Badge>
            ) : (
              <Badge variant="warning">Pendente</Badge>
            )}
          </p>
          <p className="text-xs text-slate-500">
            <Link href="/privacidade" className="text-brand-700 hover:underline">
              Política de Privacidade
            </Link>
            {" · "}
            <Link href="/termos" className="text-brand-700 hover:underline">
              Termos de Uso
            </Link>
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Histórico de empréstimos</CardTitle>
        </CardHeader>
        <CardContent>
          {data.loans.length === 0 ? (
            <p className="text-sm text-slate-500">Nenhum empréstimo registrado.</p>
          ) : (
            <ul className="space-y-3 text-sm">
              {data.loans.map((loan) => (
                <li key={loan.id} className="rounded-lg border border-slate-200 p-3">
                  <p className="font-medium text-slate-900">{loan.copy.book.title}</p>
                  <p className="text-slate-600">{loan.copy.book.author}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    Exemplar {loan.copy.code} · {loan.status}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Solicitação formal (LGPD)</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmitRequest} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="type">Tipo de pedido</Label>
              <Select
                id="type"
                value={requestType}
                onChange={(e) => setRequestType(e.target.value)}
              >
                {Object.entries(DATA_SUBJECT_REQUEST_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Descrição do pedido</Label>
              <Textarea
                id="description"
                value={requestDescription}
                onChange={(e) => setRequestDescription(e.target.value)}
                rows={4}
                required
                minLength={10}
                placeholder="Descreva o que você solicita..."
              />
            </div>
            <Button type="submit" disabled={submittingRequest}>
              {submittingRequest ? "Enviando..." : "Enviar solicitação"}
            </Button>
          </form>

          {data.dataSubjectRequests.length > 0 && (
            <div className="mt-6 space-y-3 border-t border-slate-200 pt-4">
              <h3 className="text-sm font-semibold text-slate-900">Suas solicitações</h3>
              {data.dataSubjectRequests.map((req) => (
                <div key={req.id} className="rounded-lg bg-slate-50 p-3 text-sm">
                  <p className="font-medium">
                    {DATA_SUBJECT_REQUEST_LABELS[req.type]} ·{" "}
                    {REQUEST_STATUS_LABELS[req.status]}
                  </p>
                  {req.description && (
                    <p className="mt-1 text-slate-600">{req.description}</p>
                  )}
                  {req.response && (
                    <p className="mt-2 text-slate-700">
                      <strong>Resposta:</strong> {req.response}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <p className="text-xs text-slate-500">
        Encarregado de dados:{" "}
        <a href={`mailto:${data.legalConfig.dpoEmail}`} className="text-brand-700">
          {data.legalConfig.dpoEmail}
        </a>
        . Veja também{" "}
        <Link href="/lgpd" className="text-brand-700 hover:underline">
          Seus direitos (LGPD)
        </Link>
        .
      </p>
    </div>
  );
}
