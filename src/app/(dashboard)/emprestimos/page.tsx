"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { ClipboardList, Plus, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { LoanRequestStatusBadge, LoanStatusBadge } from "@/components/status-badges";
import { formatDate } from "@/lib/utils";
import { LoanRequestStatus, LoanStatus } from "@/generated/prisma";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/responsive/page-header";
import { FilterBar } from "@/components/responsive/filter-bar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatBookCredit } from "@/lib/spiritist";

type Loan = {
  id: string;
  loanDate: string;
  dueDate: string;
  returnDate: string | null;
  status: LoanStatus;
  copy: { code: string; book: { title: string; author: string } };
  user: { name: string; email: string; cpf: string | null };
};

type LoanRequest = {
  id: string;
  status: LoanRequestStatus;
  createdAt: string;
  adminNote: string | null;
  book: { title: string; author: string; medium: string | null };
};

type Filter = "" | "ACTIVE" | "OVERDUE" | "RETURNED";
type AdminView = "circulacao" | "historico";

const filters: { value: Filter; label: string }[] = [
  { value: "", label: "Todos" },
  { value: "ACTIVE", label: "Ativos" },
  { value: "OVERDUE", label: "Atrasados" },
  { value: "RETURNED", label: "Devolvidos" },
];

const adminViews: { value: AdminView; label: string }[] = [
  { value: "circulacao", label: "Em circulação" },
  { value: "historico", label: "Histórico" },
];

function LoanCards({
  loans,
  isAdmin,
  onReturn,
  highlightReader,
}: {
  loans: Loan[];
  isAdmin: boolean;
  onReturn: (id: string) => void;
  highlightReader?: boolean;
}) {
  return (
    <div className="space-y-3 lg:hidden">
      {loans.map((loan) => (
        <Card key={loan.id}>
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <h2 className="line-clamp-1 font-semibold text-slate-900">
                  {loan.copy.book.title}
                </h2>
                <p className="text-sm text-slate-600">{loan.copy.book.author}</p>
                <p className="mt-1 font-mono text-xs text-slate-500">
                  Exemplar: {loan.copy.code}
                </p>
                {isAdmin && (
                  <p
                    className={
                      highlightReader
                        ? "mt-2 text-sm font-medium text-brand-800"
                        : "mt-1 text-sm text-slate-600"
                    }
                  >
                    Com: {loan.user.name}
                  </p>
                )}
                {!isAdmin && (
                  <p className="mt-1 text-xs text-slate-500">{loan.user.email}</p>
                )}
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                  <span>Retirada: {formatDate(loan.loanDate)}</span>
                  <span>Prazo: {formatDate(loan.dueDate)}</span>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <LoanStatusBadge status={loan.status} />
                {isAdmin && (loan.status === "ACTIVE" || loan.status === "OVERDUE") && (
                  <Button size="sm" variant="outline" onClick={() => onReturn(loan.id)}>
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function LoanTable({
  loans,
  isAdmin,
  onReturn,
  highlightReader,
}: {
  loans: Loan[];
  isAdmin: boolean;
  onReturn: (id: string) => void;
  highlightReader?: boolean;
}) {
  return (
    <Table className="hidden lg:table">
      <TableHead>
        <TableRow>
          <TableHeader>Livro</TableHeader>
          <TableHeader>Exemplar</TableHeader>
          {isAdmin && <TableHeader>Com quem está</TableHeader>}
          <TableHeader>Retirada</TableHeader>
          <TableHeader>Prazo</TableHeader>
          <TableHeader>Status</TableHeader>
          {isAdmin && <TableHeader className="text-right">Ações</TableHeader>}
        </TableRow>
      </TableHead>
      <TableBody>
        {loans.map((loan) => (
          <TableRow key={loan.id}>
            <TableCell>
              <div className="font-medium text-slate-900">{loan.copy.book.title}</div>
              <div className="text-xs text-slate-500">{loan.copy.book.author}</div>
            </TableCell>
            <TableCell className="font-mono text-xs">{loan.copy.code}</TableCell>
            {isAdmin && (
              <TableCell className={highlightReader ? "font-medium text-brand-900" : ""}>
                <div>{loan.user.name}</div>
                <div className="text-xs text-slate-500">{loan.user.email}</div>
              </TableCell>
            )}
            <TableCell>{formatDate(loan.loanDate)}</TableCell>
            <TableCell>{formatDate(loan.dueDate)}</TableCell>
            <TableCell>
              <LoanStatusBadge status={loan.status} />
            </TableCell>
            {isAdmin && (
              <TableCell className="text-right">
                {(loan.status === "ACTIVE" || loan.status === "OVERDUE") && (
                  <Button size="sm" variant="outline" onClick={() => onReturn(loan.id)}>
                    <RotateCcw className="h-4 w-4" />
                    Devolver
                  </Button>
                )}
              </TableCell>
            )}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export default function EmprestimosPage() {
  const { data: session } = useSession();
  const [loans, setLoans] = useState<Loan[]>([]);
  const [requests, setRequests] = useState<LoanRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("");
  const [adminView, setAdminView] = useState<AdminView>("circulacao");
  const isAdmin = session?.user?.role === "ADMIN";

  async function loadLoans() {
    setLoading(true);
    const params = new URLSearchParams();
    if (isAdmin && adminView === "circulacao") {
      params.set("circulating", "true");
    } else if (filter) {
      params.set("status", filter);
    }
    const res = await fetch(`/api/loans?${params}`);
    if (res.ok) setLoans(await res.json());
    setLoading(false);
  }

  async function loadRequests() {
    const url = isAdmin
      ? "/api/loan-requests?status=PENDING"
      : "/api/loan-requests";
    const res = await fetch(url);
    if (res.ok) setRequests(await res.json());
  }

  useEffect(() => {
    loadLoans();
  }, [filter, adminView, isAdmin]);

  useEffect(() => {
    if (session?.user) loadRequests();
  }, [session?.user, isAdmin]);

  async function handleReturn(loanId: string) {
    const res = await fetch(`/api/loans/${loanId}/return`, { method: "POST" });
    if (!res.ok) {
      const err = await res.json();
      toast.error(err.error ?? "Erro ao registrar devolução");
      return;
    }
    toast.success("Devolução registrada!");
    loadLoans();
  }

  async function cancelRequest(id: string) {
    const res = await fetch(`/api/loan-requests/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const err = await res.json();
      toast.error(err.error ?? "Erro ao cancelar");
      return;
    }
    toast.success("Solicitação cancelada.");
    loadRequests();
  }

  const pendingCount = requests.filter((r) => r.status === "PENDING").length;

  return (
    <div className="space-y-4">
      <PageHeader
        title={isAdmin ? "Empréstimos" : "Meus empréstimos"}
        description={
          isAdmin && adminView === "circulacao"
            ? `${loans.length} livro(s) em circulação`
            : `${loans.length} registro(s)`
        }
        action={
          isAdmin ? (
            <div className="flex flex-wrap gap-2">
              <Link href="/emprestimos/solicitacoes">
                <Button size="sm" variant="outline" className="w-full sm:w-auto">
                  <ClipboardList className="h-4 w-4" />
                  Solicitações
                  {pendingCount > 0 && (
                    <span className="ml-1 rounded-full bg-brand-600 px-1.5 text-xs text-white">
                      {pendingCount}
                    </span>
                  )}
                </Button>
              </Link>
              <Link href="/emprestimos/novo">
                <Button size="sm" className="w-full sm:w-auto">
                  <Plus className="h-4 w-4" />
                  Registrar retirada
                </Button>
              </Link>
            </div>
          ) : (
            <Link href="/emprestimos/solicitar">
              <Button size="sm" className="w-full sm:w-auto">
                <Plus className="h-4 w-4" />
                Solicitar empréstimo
              </Button>
            </Link>
          )
        }
      />

      {isAdmin ? (
        <FilterBar options={adminViews} value={adminView} onChange={setAdminView} />
      ) : null}

      {isAdmin && adminView === "historico" && (
        <FilterBar options={filters} value={filter} onChange={setFilter} />
      )}

      {!isAdmin && requests.some((r) => r.status === "PENDING") && (
        <Card className="border-brand-200 bg-brand-50">
          <CardContent className="p-4 text-sm text-brand-900">
            Você tem solicitação(ões) aguardando análise do bibliotecário.
          </CardContent>
        </Card>
      )}

      {!isAdmin && requests.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-slate-900">Minhas solicitações</h2>
          {requests.slice(0, 5).map((req) => (
            <Card key={req.id}>
              <CardContent className="flex flex-wrap items-center justify-between gap-2 p-3">
                <div>
                  <p className="font-medium text-slate-900">{req.book.title}</p>
                  <p className="text-xs text-slate-500">
                    {formatBookCredit(req.book.author, req.book.medium)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <LoanRequestStatusBadge status={req.status} />
                  {req.status === "PENDING" && (
                    <Button size="sm" variant="ghost" onClick={() => cancelRequest(req.id)}>
                      Cancelar
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full lg:h-12" />
          ))}
        </div>
      ) : loans.length === 0 ? (
        <p className="py-12 text-center text-slate-500">
          {isAdmin && adminView === "circulacao"
            ? "Nenhum livro em circulação no momento."
            : "Nenhum empréstimo encontrado."}
        </p>
      ) : (
        <>
          <LoanCards
            loans={loans}
            isAdmin={!!isAdmin}
            onReturn={handleReturn}
            highlightReader={isAdmin && adminView === "circulacao"}
          />
          <LoanTable
            loans={loans}
            isAdmin={!!isAdmin}
            onReturn={handleReturn}
            highlightReader={isAdmin && adminView === "circulacao"}
          />
        </>
      )}
    </div>
  );
}
