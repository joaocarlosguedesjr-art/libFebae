"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { SearchBar } from "@/components/search-bar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/responsive/page-header";
import { formatBookCredit } from "@/lib/spiritist";
import { fetchBooksPages } from "@/lib/client-books";

type Book = {
  id: string;
  title: string;
  author: string;
  medium: string | null;
  availableCopies: number;
};

export default function SolicitarEmprestimoPage() {
  const router = useRouter();
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const params = new URLSearchParams();
      if (query) params.set("q", query);
      try {
        const result = await fetchBooksPages<Book>(params, { pageSize: 200, maxPages: 6 });
        setBooks(result.items.filter((b) => b.availableCopies > 0));
      } catch {
        setBooks([]);
      }
      setLoading(false);
    }
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
  }, [query]);

  async function onSubmit() {
    if (!selectedId) {
      toast.error("Selecione uma obra");
      return;
    }

    setSubmitting(true);
    const res = await fetch("/api/loan-requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bookId: selectedId, readerNote: note || undefined }),
    });
    setSubmitting(false);

    if (!res.ok) {
      const err = await res.json();
      toast.error(err.error ?? "Erro ao enviar solicitação");
      return;
    }

    toast.success("Solicitação enviada! O bibliotecário analisará em breve.");
    router.push("/emprestimos");
  }

  const selected = books.find((b) => b.id === selectedId);

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <PageHeader
        title="Solicitar empréstimo"
        description="Escolha uma obra com exemplar disponível. O bibliotecário aprovará a retirada."
      />

      <SearchBar onSearch={setQuery} placeholder="Buscar no acervo..." />

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      ) : books.length === 0 ? (
        <p className="py-8 text-center text-slate-500">
          Nenhuma obra disponível encontrada. Tente outra busca.
        </p>
      ) : (
        <div className="space-y-2">
          {books.map((book) => (
            <button
              key={book.id}
              type="button"
              onClick={() => setSelectedId(book.id)}
              className="w-full text-left"
            >
              <Card
                className={
                  selectedId === book.id
                    ? "border-brand-500 ring-2 ring-brand-200"
                    : "hover:border-brand-200"
                }
              >
                <CardContent className="flex items-start justify-between gap-3 p-4">
                  <div>
                    <h2 className="font-semibold text-slate-900">{book.title}</h2>
                    <p className="text-sm text-slate-600">
                      {formatBookCredit(book.author, book.medium)}
                    </p>
                  </div>
                  <Badge variant="success">{book.availableCopies} disp.</Badge>
                </CardContent>
              </Card>
            </button>
          ))}
        </div>
      )}

      {selected && (
        <Card>
          <CardContent className="space-y-4 p-4">
            <p className="text-sm text-slate-700">
              Obra selecionada: <strong>{selected.title}</strong>
            </p>
            <div className="space-y-2">
              <Label htmlFor="note">Observação (opcional)</Label>
              <Textarea
                id="note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
                maxLength={500}
                placeholder="Ex.: Preciso para estudo do evangelho no lar..."
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button onClick={onSubmit} disabled={submitting}>
                {submitting ? "Enviando..." : "Enviar solicitação"}
              </Button>
              <Link href="/emprestimos">
                <Button variant="outline" type="button">
                  Cancelar
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
