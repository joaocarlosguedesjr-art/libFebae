"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AlertTriangle, BookOpen, Repeat, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useSession } from "next-auth/react";

type Stats = {
  totalBooks: number;
  totalCopies: number;
  totalUsers: number;
  activeLoans: number;
  overdueLoans: number;
  loansToday: number;
  pendingLoanRequests: number;
};

export default function DashboardPage() {
  const { data: session } = useSession();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const isAdmin = session?.user?.role === "ADMIN";

  useEffect(() => {
    if (!isAdmin) {
      setLoading(false);
      return;
    }

    fetch("/api/stats")
      .then((res) => res.json())
      .then(setStats)
      .finally(() => setLoading(false));
  }, [isAdmin]);

  if (!isAdmin) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Olá, {session?.user?.name?.split(" ")[0]}!
          </h1>
          <p className="text-slate-500">Consulte o acervo e acompanhe seus empréstimos.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Link href="/acervo">
            <Card className="transition-shadow hover:shadow-md">
              <CardContent className="flex items-center gap-4 p-6">
                <BookOpen className="h-8 w-8 text-brand-700" />
                <div>
                  <p className="font-semibold">Acervo</p>
                  <p className="text-sm text-slate-500">Buscar livros</p>
                </div>
              </CardContent>
            </Card>
          </Link>
          <Link href="/emprestimos/solicitar">
            <Card className="transition-shadow hover:shadow-md">
              <CardContent className="flex items-center gap-4 p-6">
                <Repeat className="h-8 w-8 text-brand-700" />
                <div>
                  <p className="font-semibold">Solicitar empréstimo</p>
                  <p className="text-sm text-slate-500">Pedir retirada de obra</p>
                </div>
              </CardContent>
            </Card>
          </Link>
          <Link href="/emprestimos">
            <Card className="transition-shadow hover:shadow-md">
              <CardContent className="flex items-center gap-4 p-6">
                <Repeat className="h-8 w-8 text-brand-700" />
                <div>
                  <p className="font-semibold">Meus empréstimos</p>
                  <p className="text-sm text-slate-500">Ver histórico</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    );
  }

  const cards = [
    { label: "Títulos", value: stats?.totalBooks, icon: BookOpen },
    { label: "Exemplares", value: stats?.totalCopies, icon: BookOpen },
    { label: "Leitores", value: stats?.totalUsers, icon: Users },
    { label: "Em circulação", value: stats?.activeLoans, icon: Repeat },
    { label: "Solicitações pendentes", value: stats?.pendingLoanRequests, icon: Repeat, warn: true },
    { label: "Atrasados", value: stats?.overdueLoans, icon: AlertTriangle, danger: true },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Painel</h1>
        <p className="text-slate-500">Visão geral da biblioteca</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map(({ label, value, icon: Icon, danger, warn }) => (
          <Card key={label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-500">{label}</CardTitle>
              <Icon
                className={`h-5 w-5 ${
                  danger ? "text-red-500" : warn && value ? "text-amber-500" : "text-brand-700"
                }`}
              />
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <p
                  className={`text-3xl font-bold ${
                    danger && value ? "text-red-600" : warn && value ? "text-amber-600" : ""
                  }`}
                >
                  {value ?? 0}
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { href: "/acervo/novo", label: "Novo livro" },
          { href: "/emprestimos/solicitacoes", label: "Solicitações de empréstimo" },
          { href: "/emprestimos", label: "Livros em circulação" },
          { href: "/emprestimos/novo", label: "Registrar retirada" },
          { href: "/usuarios/novo", label: "Novo leitor" },
          { href: "/configuracoes", label: "Configurações" },
          { href: "/catalogo", label: "Catálogo público" },
        ].map((action) => (
          <Link
            key={action.href}
            href={action.href}
            className="rounded-xl border border-brand-200 bg-brand-50 px-4 py-3 text-center text-sm font-medium text-brand-800 transition-colors hover:bg-brand-100"
          >
            {action.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
