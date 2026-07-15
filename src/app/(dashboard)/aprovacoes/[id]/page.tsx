"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";

type ApprovalDetail = {
  id: string;
  type: string;
  typeLabel: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  summary: string;
  adminNote: string | null;
  createdAt: string;
  reviewedAt: string | null;
  payload: unknown;
  entityPreview: unknown;
  requestedBy: { name: string; email: string; role: string };
  reviewedBy: { name: string; email: string } | null;
};

function PayloadPreview({ payload }: { payload: unknown }) {
  if (!payload || typeof payload !== "object") {
    return <p className="text-sm text-slate-500">Sem dados adicionais.</p>;
  }

  const entries = Object.entries(payload as Record<string, unknown>).filter(
    ([, v]) => v !== undefined && v !== null && v !== "",
  );

  if (entries.length === 0) {
    return <p className="text-sm text-slate-500">Sem dados adicionais.</p>;
  }

  return (
    <dl className="space-y-2 text-sm">
      {entries.map(([key, value]) => (
        <div key={key} className="grid gap-1 sm:grid-cols-[140px_1fr]">
          <dt className="font-medium text-slate-600">{key}</dt>
          <dd className="break-all text-slate-900">
            {typeof value === "object" ? JSON.stringify(value, null, 2) : String(value)}
          </dd>
        </div>
      ))}
    </dl>
  );
}

function EntityPreview({ data }: { data: unknown }) {
  if (!data || typeof data !== "object") return null;

  const record = data as Record<string, unknown>;
  const title =
    (record.title as string) ||
    (record.name as string) ||
    (record.type as string) ||
    "Registro atual";

  return (
    <Card className="border-slate-200 bg-slate-50/50">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Registro no sistema</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="mb-2 font-medium text-slate-900">{title}</p>
        <pre className="max-h-64 overflow-auto rounded-lg bg-white p-3 text-xs text-slate-700">
          {JSON.stringify(data, null, 2)}
        </pre>
      </CardContent>
    </Card>
  );
}

export default function AprovacaoDetalhePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [detail, setDetail] = useState<ApprovalDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [adminNote, setAdminNote] = useState("");
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const res = await fetch(`/api/approvals/${id}`);
      if (res.ok) setDetail(await res.json());
      setLoading(false);
    }
    load();
  }, [id]);

  async function review(action: "approve" | "reject") {
    setProcessing(true);
    const res = await fetch(`/api/approvals/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, adminNote: adminNote || undefined }),
    });
    setProcessing(false);

    if (!res.ok) {
      const err = await res.json();
      toast.error(err.error ?? "Erro ao processar");
      return;
    }

    toast.success(action === "approve" ? "Solicitação aprovada" : "Solicitação rejeitada");
    router.push("/aprovacoes");
    router.refresh();
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (!detail) {
    return <p className="text-slate-500">Solicitação não encontrada.</p>;
  }

  const isPending = detail.status === "PENDING";

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link
        href="/aprovacoes"
        className="inline-flex items-center gap-2 text-sm text-brand-700 hover:underline"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar às aprovações
      </Link>

      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary">{detail.typeLabel}</Badge>
          <Badge
            variant={
              detail.status === "PENDING"
                ? "warning"
                : detail.status === "APPROVED"
                  ? "success"
                  : "danger"
            }
          >
            {detail.status === "PENDING"
              ? "Pendente"
              : detail.status === "APPROVED"
                ? "Aprovada"
                : "Rejeitada"}
          </Badge>
        </div>
        <h1 className="text-2xl font-bold text-slate-900">{detail.summary}</h1>
        <p className="text-sm text-slate-500">
          Solicitado por {detail.requestedBy.name} em{" "}
          {new Date(detail.createdAt).toLocaleString("pt-BR")}
        </p>
      </div>

      {detail.entityPreview != null ? (
        <EntityPreview data={detail.entityPreview} />
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Dados da solicitação</CardTitle>
        </CardHeader>
        <CardContent>
          <PayloadPreview payload={detail.payload} />
        </CardContent>
      </Card>

      {detail.reviewedBy && (
        <Card>
          <CardContent className="space-y-1 p-4 text-sm text-slate-600">
            <p>
              Revisado por <strong>{detail.reviewedBy.name}</strong>
              {detail.reviewedAt && ` em ${new Date(detail.reviewedAt).toLocaleString("pt-BR")}`}
            </p>
            {detail.adminNote && <p>Observação: {detail.adminNote}</p>}
          </CardContent>
        </Card>
      )}

      {isPending && (
        <Card>
          <CardHeader>
            <CardTitle>Decisão</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="adminNote">Observação (opcional)</Label>
              <Textarea
                id="adminNote"
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
                rows={3}
                placeholder="Motivo da rejeição ou nota interna"
              />
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                disabled={processing}
                onClick={() => review("reject")}
              >
                Rejeitar
              </Button>
              <Button type="button" disabled={processing} onClick={() => review("approve")}>
                {processing ? "Processando..." : "Aprovar e executar"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
