"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/responsive/page-header";
import {
  DATA_SUBJECT_REQUEST_LABELS,
  REQUEST_STATUS_LABELS,
} from "@/lib/lgpd.constants";

type Request = {
  id: string;
  type: string;
  status: string;
  description: string | null;
  response: string | null;
  createdAt: string;
  user: { name: string; email: string };
};

export default function LgpdSolicitacoesPage() {
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [statuses, setStatuses] = useState<Record<string, string>>({});

  async function load() {
    setLoading(true);
    const res = await fetch("/api/lgpd/requests");
    if (res.ok) {
      const data: Request[] = await res.json();
      setRequests(data);
      const initialStatus: Record<string, string> = {};
      const initialResponse: Record<string, string> = {};
      data.forEach((r) => {
        initialStatus[r.id] = r.status === "PENDING" ? "IN_PROGRESS" : r.status;
        initialResponse[r.id] = r.response ?? "";
      });
      setStatuses(initialStatus);
      setResponses(initialResponse);
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleRequest(id: string) {
    const res = await fetch(`/api/lgpd/requests/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status: statuses[id],
        response: responses[id],
      }),
    });

    if (!res.ok) {
      const err = await res.json();
      toast.error(err.error ?? "Erro ao atualizar solicitação");
      return;
    }

    toast.success("Solicitação atualizada.");
    load();
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Solicitações LGPD"
        description="Pedidos dos titulares previstos na Lei 13.709/2018"
      />

      {loading ? (
        <p className="text-slate-500">Carregando...</p>
      ) : requests.length === 0 ? (
        <p className="py-12 text-center text-slate-500">Nenhuma solicitação registrada.</p>
      ) : (
        <div className="space-y-4">
          {requests.map((req) => (
            <Card key={req.id}>
              <CardContent className="space-y-4 p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-slate-900">
                      {DATA_SUBJECT_REQUEST_LABELS[req.type]}
                    </p>
                    <p className="text-sm text-slate-600">
                      {req.user.name} · {req.user.email}
                    </p>
                    <p className="text-xs text-slate-500">
                      {new Date(req.createdAt).toLocaleString("pt-BR")}
                    </p>
                  </div>
                  <Badge
                    variant={
                      req.status === "COMPLETED"
                        ? "success"
                        : req.status === "REJECTED"
                          ? "warning"
                          : "default"
                    }
                  >
                    {REQUEST_STATUS_LABELS[req.status]}
                  </Badge>
                </div>

                {req.description && (
                  <p className="rounded-lg bg-slate-50 p-3 text-sm text-slate-700">
                    {req.description}
                  </p>
                )}

                <div className="grid gap-3 md:grid-cols-2">
                  <Select
                    value={statuses[req.id] ?? "IN_PROGRESS"}
                    onChange={(e) =>
                      setStatuses((prev) => ({ ...prev, [req.id]: e.target.value }))
                    }
                  >
                    <option value="IN_PROGRESS">Em andamento</option>
                    <option value="COMPLETED">Concluída</option>
                    <option value="REJECTED">Indeferida</option>
                  </Select>
                  <Button type="button" onClick={() => handleRequest(req.id)}>
                    Salvar resposta
                  </Button>
                </div>
                <Textarea
                  value={responses[req.id] ?? ""}
                  onChange={(e) =>
                    setResponses((prev) => ({ ...prev, [req.id]: e.target.value }))
                  }
                  rows={3}
                  placeholder="Resposta ao titular (obrigatória ao concluir ou indeferir)"
                />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
