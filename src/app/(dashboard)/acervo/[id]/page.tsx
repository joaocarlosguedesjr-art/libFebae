"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CopyStatusBadge } from "@/components/status-badges";
import { CopyStatus, SpiritWorkType } from "@/generated/prisma";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { formatBookCredit, formatWorkType } from "@/lib/spiritist";
import { isStaff } from "@/lib/roles";
import { handleStaffMutationResponse } from "@/lib/staff-mutation";

type Copy = {
  id: string;
  code: string;
  legacyNumber: number | null;
  shelfOrder: number | null;
  status: CopyStatus;
};

type Book = {
  id: string;
  workNumber: number | null;
  catalogNumber: string | null;
  authorGroup: string | null;
  title: string;
  subtitle: string | null;
  author: string;
  medium: string | null;
  workType: SpiritWorkType | null;
  isbn: string | null;
  publisher: string | null;
  year: number | null;
  edition: string | null;
  collection: string | null;
  pages: number | null;
  language: string | null;
  synopsis: string | null;
  notes: string | null;
  copies: Copy[];
  categories: { id: string; name: string }[];
};

function InfoRow({ label, value }: { label: string; value?: string | number | null }) {
  if (value === null || value === undefined || value === "") return null;
  return (
    <p>
      <span className="font-medium text-slate-700">{label}:</span> {value}
    </p>
  );
}

export default function LivroDetalhePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: session } = useSession();
  const [book, setBook] = useState<Book | null>(null);
  const [loading, setLoading] = useState(true);
  const [newCode, setNewCode] = useState("");
  const [adding, setAdding] = useState(false);
  const isStaffUser = isStaff(session?.user?.role);
  const availableCopies = book?.copies.filter((c) => c.status === "AVAILABLE").length ?? 0;

  async function loadBook() {
    const res = await fetch(`/api/books/${id}`);
    if (res.ok) setBook(await res.json());
    setLoading(false);
  }

  useEffect(() => {
    loadBook();
  }, [id]);

  async function addCopy() {
    if (!newCode.trim()) return;
    setAdding(true);
    const res = await fetch("/api/copies", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bookId: id, code: newCode.trim() }),
    });
    setAdding(false);
    const result = await handleStaffMutationResponse(res, "Exemplar adicionado!");
    if (!result.ok) return;
    if (!result.pending) {
      setNewCode("");
      loadBook();
    }
  }

  async function deleteBook() {
    if (!confirm("Excluir esta obra e todos os exemplares?")) return;
    const res = await fetch(`/api/books/${id}`, { method: "DELETE" });
    const result = await handleStaffMutationResponse(res, "Obra excluída");
    if (!result.ok) return;
    if (!result.pending) router.push("/acervo");
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (!book) {
    return <p className="text-slate-500">Obra não encontrada.</p>;
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{book.title}</h1>
          {book.subtitle && <p className="text-slate-600">{book.subtitle}</p>}
          <p className="mt-1 text-slate-600">{formatBookCredit(book.author, book.medium)}</p>
          {book.workType && (
            <Badge variant="secondary" className="mt-2">
              {formatWorkType(book.workType)}
            </Badge>
          )}
        </div>
        {isStaffUser && (
          <div className="flex shrink-0 flex-col gap-2">
            {availableCopies > 0 && (
              <Link href={`/emprestimos/novo?bookId=${book.id}`}>
                <Button size="sm">
                  <Plus className="h-4 w-4" />
                  Emprestar
                </Button>
              </Link>
            )}
            <Button variant="destructive" size="sm" onClick={deleteBook}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Ficha catalográfica</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {book.categories.length > 0 && (
            <div className="flex flex-wrap gap-2 pb-2">
              {book.categories.map((c) => (
                <Badge key={c.id} variant="secondary">
                  {c.name}
                </Badge>
              ))}
            </div>
          )}
          <InfoRow label="Nº da obra" value={book.workNumber ?? book.catalogNumber} />
          <InfoRow label="Grupo autor / espírito" value={book.authorGroup} />
          <InfoRow label="Coleção / Série" value={book.collection} />
          <InfoRow label="Editora" value={book.publisher} />
          <InfoRow label="Ano" value={book.year} />
          <InfoRow label="Edição" value={book.edition} />
          <InfoRow label="Páginas" value={book.pages} />
          <InfoRow label="Idioma" value={book.language} />
          <InfoRow label="ISBN" value={book.isbn} />
          {book.synopsis && (
            <div className="pt-2">
              <p className="font-medium text-slate-700">Sinopse</p>
              <p className="text-slate-600">{book.synopsis}</p>
            </div>
          )}
          {book.notes && isStaffUser && (
            <div className="pt-2">
              <p className="font-medium text-slate-700">Observações</p>
              <p className="text-slate-600">{book.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Exemplares ({book.copies.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {book.copies.length === 0 ? (
            <p className="text-sm text-slate-500">Nenhum exemplar cadastrado.</p>
          ) : (
            book.copies.map((copy) => (
              <div
                key={copy.id}
                className="flex items-center justify-between rounded-lg border border-slate-200 px-4 py-3"
              >
                <div>
                  <span className="font-mono font-medium">{copy.code}</span>
                  {(copy.legacyNumber || copy.shelfOrder) && (
                    <p className="text-xs text-slate-500">
                      {copy.legacyNumber ? `Nº legado: ${copy.legacyNumber}` : null}
                      {copy.legacyNumber && copy.shelfOrder ? " · " : null}
                      {copy.shelfOrder ? `Ordem estante: ${copy.shelfOrder}` : null}
                    </p>
                  )}
                </div>
                <CopyStatusBadge status={copy.status} />
              </div>
            ))
          )}

          {isStaffUser && (
            <div className="flex gap-2 pt-2">
              <div className="flex-1 space-y-1">
                <Label htmlFor="code">Novo exemplar</Label>
                <Input
                  id="code"
                  placeholder="Ex: EX-001"
                  value={newCode}
                  onChange={(e) => setNewCode(e.target.value)}
                />
              </div>
              <Button className="mt-6" onClick={addCopy} disabled={adding}>
                <Plus className="h-4 w-4" />
                Adicionar
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
