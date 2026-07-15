"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ClipboardCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/responsive/page-header";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type ApprovalItem = {
  id: string;
  type: string;
  typeLabel: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  summary: string;
  createdAt: string;
  requestedBy: { name: string; email: string };
};

const statusLabels = {
  PENDING: "Pendente",
  APPROVED: "Aprovada",
  REJECTED: "Rejeitada",
} as const;

function statusVariant(status: ApprovalItem["status"]) {
  if (status === "PENDING") return "warning" as const;
  if (status === "APPROVED") return "success" as const;
  return "danger" as const;
}

export default function AprovacoesPage() {
  const [items, setItems] = useState<ApprovalItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"PENDING" | "APPROVED" | "REJECTED">("PENDING");

  useEffect(() => {
    async function load() {
      setLoading(true);
      const res = await fetch(`/api/approvals?status=${filter}`);
      if (res.ok) setItems(await res.json());
      setLoading(false);
    }
    load();
  }, [filter]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Aprovações"
        description="Revise e autorize ações solicitadas pelos bibliotecários"
      />

      <div className="flex flex-wrap gap-2">
        {(["PENDING", "APPROVED", "REJECTED"] as const).map((status) => (
          <Button
            key={status}
            type="button"
            size="sm"
            variant={filter === status ? "default" : "outline"}
            onClick={() => setFilter(status)}
          >
            {statusLabels[status]}
          </Button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      ) : items.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <ClipboardCheck className="h-10 w-10 text-slate-300" />
            <p className="text-slate-500">Nenhuma solicitação {statusLabels[filter].toLowerCase()}.</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="space-y-3 lg:hidden">
            {items.map((item) => (
              <Card key={item.id}>
                <CardContent className="space-y-3 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium text-slate-900">{item.summary}</p>
                      <p className="text-xs text-slate-500">{item.typeLabel}</p>
                    </div>
                    <Badge variant={statusVariant(item.status)}>{statusLabels[item.status]}</Badge>
                  </div>
                  <p className="text-sm text-slate-600">
                    Por {item.requestedBy.name} ·{" "}
                    {new Date(item.createdAt).toLocaleString("pt-BR")}
                  </p>
                  <Link href={`/aprovacoes/${item.id}`}>
                    <Button size="sm" variant="outline" className="w-full">
                      Analisar
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>

          <Table className="hidden lg:table">
            <TableHead>
              <TableRow>
                <TableHeader>Solicitação</TableHeader>
                <TableHeader>Tipo</TableHeader>
                <TableHeader>Solicitante</TableHeader>
                <TableHeader>Data</TableHeader>
                <TableHeader>Status</TableHeader>
                <TableHeader className="text-right">Ação</TableHeader>
              </TableRow>
            </TableHead>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="max-w-xs font-medium">{item.summary}</TableCell>
                  <TableCell>{item.typeLabel}</TableCell>
                  <TableCell>
                    <div>
                      <p>{item.requestedBy.name}</p>
                      <p className="text-xs text-slate-500">{item.requestedBy.email}</p>
                    </div>
                  </TableCell>
                  <TableCell>{new Date(item.createdAt).toLocaleString("pt-BR")}</TableCell>
                  <TableCell>
                    <Badge variant={statusVariant(item.status)}>{statusLabels[item.status]}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Link href={`/aprovacoes/${item.id}`}>
                      <Button size="sm" variant="outline">
                        Analisar
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </>
      )}
    </div>
  );
}
