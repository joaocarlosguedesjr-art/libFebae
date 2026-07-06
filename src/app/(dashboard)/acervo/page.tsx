"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { useSession } from "next-auth/react";
import { SearchBar } from "@/components/search-bar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/responsive/page-header";

import { formatBookCredit } from "@/lib/spiritist";
import { fetchBooksPages } from "@/lib/client-books";

type Book = {
  id: string;
  workNumber: number | null;
  catalogNumber: string | null;
  authorGroup: string | null;
  title: string;
  subtitle: string | null;
  author: string;
  medium: string | null;
  year: number | null;
  collection: string | null;
  availableCopies: number;
  _count: { copies: number };
};

function BookListMobile({ books }: { books: Book[] }) {
  return (
    <div className="space-y-3 md:hidden">
      {books.map((book) => (
        <Link key={book.id} href={`/acervo/${book.id}`}>
          <Card className="transition-shadow hover:shadow-md">
            <CardContent className="p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <h2 className="line-clamp-2 font-semibold text-slate-900">{book.title}</h2>
                {(book.workNumber ?? book.catalogNumber) && (
                  <Badge variant="secondary" className="shrink-0 font-mono text-xs">
                    {book.workNumber ?? book.catalogNumber}
                  </Badge>
                )}
              </div>
              <p className="mt-1 text-sm text-slate-600">
                {formatBookCredit(book.author, book.medium)}
              </p>
              {book.collection && (
                <p className="mt-1 text-xs text-slate-500">{book.collection}</p>
              )}
              <div className="mt-3 flex flex-wrap gap-2">
                <Badge variant="secondary">{book._count.copies} exemplar(es)</Badge>
                <Badge variant={book.availableCopies > 0 ? "success" : "warning"}>
                  {book.availableCopies} disponível(is)
                </Badge>
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}

function BookGridTabletDesktop({ books }: { books: Book[] }) {
  return (
    <div className="hidden grid-cols-2 gap-3 md:grid lg:grid-cols-3 xl:grid-cols-4">
      {books.map((book) => (
        <Link key={book.id} href={`/acervo/${book.id}`}>
          <Card className="h-full transition-shadow hover:shadow-md">
            <CardContent className="p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <h2 className="line-clamp-2 font-semibold text-slate-900">{book.title}</h2>
                {(book.workNumber ?? book.catalogNumber) && (
                  <Badge variant="secondary" className="shrink-0 font-mono text-xs">
                    {book.workNumber ?? book.catalogNumber}
                  </Badge>
                )}
              </div>
              <p className="mt-1 text-sm text-slate-600">
                {formatBookCredit(book.author, book.medium)}
              </p>
              {book.collection && (
                <p className="mt-1 text-xs text-slate-500">{book.collection}</p>
              )}
              {book.year && (
                <p className="mt-1 text-xs text-slate-500">Ano: {book.year}</p>
              )}
              <div className="mt-3 flex flex-wrap gap-2">
                <Badge variant="secondary">{book._count.copies} exemplar(es)</Badge>
                <Badge variant={book.availableCopies > 0 ? "success" : "warning"}>
                  {book.availableCopies} disponível(is)
                </Badge>
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}

export default function AcervoPage() {
  const { data: session } = useSession();
  const [books, setBooks] = useState<Book[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const isAdmin = session?.user?.role === "ADMIN";

  useEffect(() => {
    async function fetchBooks() {
      setLoading(true);
      const params = new URLSearchParams();
      if (query) params.set("q", query);
      try {
        const result = await fetchBooksPages<Book>(params, { pageSize: 200, maxPages: 8 });
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
    <div className="space-y-4">
      <PageHeader
        title="Acervo"
        description={`${total || books.length} título(s)`}
        action={
          isAdmin ? (
            <Link href="/acervo/novo">
              <Button size="sm" className="w-full sm:w-auto">
                <Plus className="h-4 w-4" />
                Novo livro
              </Button>
            </Link>
          ) : undefined
        }
      />

      <SearchBar onSearch={setQuery} />

      {loading ? (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : books.length === 0 ? (
        <p className="py-12 text-center text-slate-500">Nenhum livro encontrado.</p>
      ) : (
        <>
          <BookListMobile books={books} />
          <BookGridTabletDesktop books={books} />
        </>
      )}
    </div>
  );
}
