"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { LogIn, MessageCircle } from "lucide-react";
import { InstitutionLogoLink } from "@/components/institution/institution-logo-link";
import { SearchBar } from "@/components/search-bar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { BookAssistant, openBookAssistant } from "@/components/chat/book-assistant";
import { PublicFooter } from "@/components/legal/public-footer";

import { formatBookCredit } from "@/lib/spiritist";
import { fetchBooksPages } from "@/lib/client-books";

type Book = {
  id: string;
  title: string;
  subtitle: string | null;
  author: string;
  medium: string | null;
  year: number | null;
  collection: string | null;
  availableCopies: number;
};

function CatalogList({ books }: { books: Book[] }) {
  return (
    <div className="space-y-3 md:hidden">
      {books.map((book) => (
        <Card key={book.id}>
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-semibold text-slate-900">{book.title}</h2>
                <p className="text-sm text-slate-600">
                  {formatBookCredit(book.author, book.medium)}
                </p>
                <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-500">
                  {book.collection && <span>{book.collection}</span>}
                  {book.year && <span>Ano: {book.year}</span>}
                </div>
              </div>
              <Badge variant={book.availableCopies > 0 ? "success" : "warning"}>
                {book.availableCopies > 0
                  ? `${book.availableCopies} disponível(is)`
                  : "Indisponível"}
              </Badge>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function CatalogGrid({ books }: { books: Book[] }) {
  return (
    <div className="hidden grid-cols-2 gap-4 md:grid lg:grid-cols-3">
      {books.map((book) => (
        <Card key={book.id} className="h-full">
          <CardContent className="flex h-full flex-col p-5">
            <h2 className="line-clamp-2 font-semibold text-slate-900">{book.title}</h2>
            <p className="mt-1 text-sm text-slate-600">
              {formatBookCredit(book.author, book.medium)}
            </p>
            <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-500">
              {book.collection && <span>{book.collection}</span>}
              {book.year && <span>Ano: {book.year}</span>}
            </div>
            <div className="mt-auto pt-4">
              <Badge variant={book.availableCopies > 0 ? "success" : "warning"}>
                {book.availableCopies > 0
                  ? `${book.availableCopies} disponível(is)`
                  : "Indisponível"}
              </Badge>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default function CatalogoPage() {
  const [books, setBooks] = useState<Book[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("assistente") === "1") {
      openBookAssistant();
    }
  }, []);

  useEffect(() => {
    async function fetchBooks() {
      setLoading(true);
      const params = new URLSearchParams({ public: "true" });
      if (query) params.set("q", query);
      try {
        const result = await fetchBooksPages<Book>(params, { pageSize: 100, maxPages: 12 });
        setBooks(result.items);
        setTotal(result.total);
      } catch {
        setBooks([]);
        setTotal(0);
      }
      setLoading(false);
    }

    const timeout = setTimeout(fetchBooks, 300);
    return () => clearTimeout(timeout);
  }, [query]);

  return (
    <div className="min-h-screen bg-[var(--background)] pb-24">
      <header className="border-b border-brand-200 bg-brand-header">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 p-4 md:px-6 md:py-5">
          <div className="flex items-center gap-3">
            <InstitutionLogoLink size="md" />
            <div className="hidden sm:block">
              <h1 className="text-lg font-bold text-brand-900 md:text-xl">Catálogo</h1>
              <p className="text-sm text-brand-700/80">Consulta pública do acervo</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              className="hidden sm:flex"
              onClick={() => openBookAssistant()}
            >
              <MessageCircle className="h-4 w-4" />
              Assistente
            </Button>
            <Link href="/login">
              <Button variant="outline" size="sm" className="border-brand-200 hover:bg-brand-50">
                <LogIn className="h-4 w-4" />
                <span className="hidden sm:inline">Entrar</span>
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl p-4 md:p-6">
        <p className="mb-4 rounded-xl border border-brand-200 bg-brand-50 px-4 py-3 text-sm text-brand-800">
          Use o botão <strong>Assistente</strong> no canto da tela para buscar obras por tema,
          autor ou estilo nas sinopses do acervo.
        </p>

        <SearchBar onSearch={setQuery} defaultValue={query} />

        {!loading && total > books.length && (
          <p className="mb-2 text-xs text-slate-500">
            Exibindo {books.length} de {total} título(s). Refine a busca para ver mais.
          </p>
        )}

        {loading ? (
          <div className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-24 w-full md:h-40" />
            ))}
          </div>
        ) : books.length === 0 ? (
          <p className="py-12 text-center text-slate-500">Nenhum livro encontrado.</p>
        ) : (
          <div className="mt-4">
            <CatalogList books={books} />
            <CatalogGrid books={books} />
          </div>
        )}
      </main>

      <BookAssistant />
      <PublicFooter />
    </div>
  );
}
