"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { SearchBar } from "@/components/search-bar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/responsive/page-header";
import { maskCpf } from "@/lib/cpf";
import { roleLabel } from "@/lib/roles";
import type { UserRole } from "@/lib/roles";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type User = {
  id: string;
  name: string;
  email: string;
  cpf: string | null;
  role: UserRole;
  _count: { loans: number };
};

function UserCards({ users }: { users: User[] }) {
  return (
    <div className="space-y-3 lg:hidden">
      {users.map((user) => (
        <Card key={user.id}>
          <CardContent className="flex items-center justify-between gap-3 p-4">
            <div>
              <h2 className="font-semibold text-slate-900">{user.name}</h2>
              <p className="text-sm text-slate-600">{user.email}</p>
              {user.cpf && <p className="text-xs text-slate-500">CPF: {maskCpf(user.cpf)}</p>}
            </div>
            <div className="flex flex-col items-end gap-1">
              <Badge variant={user.role === "READER" ? "default" : "secondary"}>
                {roleLabel(user.role)}
              </Badge>
              <span className="text-xs text-slate-500">
                {user._count.loans} empréstimo(s)
              </span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function UserTable({ users }: { users: User[] }) {
  return (
    <Table className="hidden lg:table">
      <TableHead>
        <TableRow>
          <TableHeader>Nome</TableHeader>
          <TableHeader>E-mail</TableHeader>
          <TableHeader>CPF</TableHeader>
          <TableHeader>Perfil</TableHeader>
          <TableHeader className="text-right">Empréstimos</TableHeader>
        </TableRow>
      </TableHead>
      <TableBody>
        {users.map((user) => (
          <TableRow key={user.id}>
            <TableCell className="font-medium">{user.name}</TableCell>
            <TableCell>{user.email}</TableCell>
            <TableCell>{user.cpf ? maskCpf(user.cpf) : "—"}</TableCell>
            <TableCell>
              <Badge variant={user.role === "READER" ? "default" : "secondary"}>
                {roleLabel(user.role)}
              </Badge>
            </TableCell>
            <TableCell className="text-right">{user._count.loans}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export default function UsuariosPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  useEffect(() => {
    async function fetchUsers() {
      setLoading(true);
      const params = new URLSearchParams();
      if (query) params.set("q", query);
      const res = await fetch(`/api/users?${params}`);
      if (res.ok) setUsers(await res.json());
      setLoading(false);
    }
    const timeout = setTimeout(fetchUsers, 300);
    return () => clearTimeout(timeout);
  }, [query]);

  return (
    <div className="space-y-4">
      <PageHeader
        title="Usuários"
        description={`${users.length} cadastrado(s)`}
        action={
          <Link href="/usuarios/novo">
            <Button size="sm" className="w-full sm:w-auto">
              <Plus className="h-4 w-4" />
              Novo leitor
            </Button>
          </Link>
        }
      />

      <SearchBar placeholder="Buscar por nome, e-mail ou CPF..." onSearch={setQuery} />

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full lg:h-12" />
          ))}
        </div>
      ) : users.length === 0 ? (
        <p className="py-12 text-center text-slate-500">Nenhum usuário encontrado.</p>
      ) : (
        <>
          <UserCards users={users} />
          <UserTable users={users} />
        </>
      )}
    </div>
  );
}
