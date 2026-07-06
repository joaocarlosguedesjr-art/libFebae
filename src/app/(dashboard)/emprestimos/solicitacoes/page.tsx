"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader } from "@/components/responsive/page-header";
import { LoanRequestStatusBadge } from "@/components/status-badges";
import { formatDate } from "@/lib/utils";
import { formatBookCredit } from "@/lib/spiritist";
import type { LoanRequestStatus } from "@/generated/prisma";
import { Skeleton } from "@/components/ui/skeleton";

type LoanRequest = {
  id: string;
  status: LoanRequestStatus;
  readerNote: string | null;
  adminNote: string | null;
  createdAt: string;
  reviewedAt: string | null;
  user: { id: string; name: string; email: string };
  book: {
    id: string;
    title: string;
    author: string;
    medium: string | null;
    copies: Array<{ id: string; code: string; status: string }>;
  };
};

export default function SolicitacoesEmprestimoPage() {
  const [requests, setRequests] = useState<LoanRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [copyByRequest, setCopyByRequest] = useState<Record<string, string>>({});
  const [rejectNote, setRejectNote] = useState<Record<string, string>>({});

  async function load() {
    setLoading(true);
    const res = await fetch("/api/loan-requests?status=PENDING");
    if (res.ok) setRequests(await res.json());
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleApprove(id: string) {
    const copyId = copyByRequest[id];
    if (!copyId) {
      toast.error("Selecione o exemplar para emprestar");
      return;
    }

    setProcessingId(id);
    const res = await fetch(`/api/loan-requests/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "approve", copyId }),
    });
    setProcessingId(null);

    if (!res.ok) {
      const err = await res.json();
      toast.error(err.error ?? "Erro ao aprovar");
      return;
    }

    toast.success("Empréstimo registrado!");
    load();
  }

  async function handleReject(id: string) {
    setProcessingId(id);
    const res = await fetch(`/api/loan-requests/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "reject",
        adminNote: rejectNote[id] || undefined,
      }),
    });
    setProcessingId(null);

    if (!res.ok) {
      const err = await res.json();
      toast.error(err.error ?? "Erro ao indeferir");
      return;
    }

    toast.success("Solicitação indeferida.");
    load();
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Solicitações de empréstimo"
        description="Analise pedidos dos leitores e registre a retirada do exemplar."
        action={
          <Link href="/emprestimos">
            <Button variant="outline" size="sm">
              Ver em circulação
            </Button>
          </Link>
        }
      />

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-40 w-full" />
          ))}
        </div>
      ) : requests.length === 0 ? (
        <p className="py-12 text-center text-slate-500">Nenhuma solicitação pendente.</p>
      ) : (
        <div className="space-y-4">
          {requests.map((req) => {
            const availableCopies = req.book.copies.filter((c) => c.status === "AVAILABLE");
            return (
              <Card key={req.id}>
                <CardContent className="space-y-4 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <h2 className="font-semibold text-slate-900">{req.book.title}</h2>
                      <p className="text-sm text-slate-600">
                        {formatBookCredit(req.book.author, req.book.medium)}
                      </p>
                      <p className="mt-1 text-sm text-slate-700">
                        Leitor: <strong>{req.user.name}</strong> ({req.user.email})
                      </p>
                      <p className="text-xs text-slate-500">
                        Solicitado em {formatDate(req.createdAt)}
                      </p>
                    </div>
                    <LoanRequestStatusBadge status={req.status} />
                  </div>

                  {req.readerNote && (
                    <p className="rounded-lg bg-slate-50 p-3 text-sm text-slate-700">
                      <strong>Mensagem do leitor:</strong> {req.readerNote}
                    </p>
                  )}

                  <div className="grid gap-4 border-t border-slate-100 pt-4 lg:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Exemplar para empréstimo</Label>
                      <Select
                        value={copyByRequest[req.id] ?? ""}
                        onChange={(e) =>
                          setCopyByRequest((prev) => ({ ...prev, [req.id]: e.target.value }))
                        }
                      >
                        <option value="">Selecione...</option>
                        {availableCopies.map((copy) => (
                          <option key={copy.id} value={copy.id}>
                            {copy.code}
                          </option>
                        ))}
                      </Select>
                      {availableCopies.length === 0 && (
                        <p className="text-xs text-red-600">Sem exemplares disponíveis agora.</p>
                      )}
                      <Button
                        size="sm"
                        onClick={() => handleApprove(req.id)}
                        disabled={processingId === req.id || availableCopies.length === 0}
                      >
                        <Check className="h-4 w-4" />
                        Aprovar e emprestar
                      </Button>
                    </div>

                    <div className="space-y-2">
                      <Label>Motivo do indeferimento (opcional)</Label>
                      <Textarea
                        rows={2}
                        value={rejectNote[req.id] ?? ""}
                        onChange={(e) =>
                          setRejectNote((prev) => ({ ...prev, [req.id]: e.target.value }))
                        }
                        placeholder="Ex.: Obra reservada para evento..."
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleReject(req.id)}
                        disabled={processingId === req.id}
                      >
                        <X className="h-4 w-4" />
                        Indeferir
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
