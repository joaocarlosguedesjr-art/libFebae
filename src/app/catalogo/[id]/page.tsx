"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { InstitutionLogoLink } from "@/components/institution/institution-logo-link";
import { BookCover } from "@/components/books/book-cover";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { PublicFooter } from "@/components/legal/public-footer";
import { formatBookCredit } from "@/lib/spiritist";

type PublicBook = {
  id: string;
  title: string;
  subtitle: string | null;
  author: string;
  medium: string | null;
  synopsis: string | null;
  year: number | null;
  collection: string | null;
  coverImageUrl: string | null;
  availableCopies: number;
};

export default function CatalogoDetalhePage() {
  const { id } = useParams<{ id: string }>();
  const [book, setBook] = useState<PublicBook | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadBook() {
      setLoading(true);
      const res = await fetch(`/api/books/${id}?public=true`, { cache: "no-store" });
      if (res.ok) {
        setBook(await res.json());
      } else {
        setBook(null);
      }
      setLoading(false);
    }
    void loadBook();
  }, [id]);

  return (
    <div className="min-h-screen bg-[var(--background)] pb-24">
      <header className="border-b border-brand-200 bg-brand-header">
        <div className="mx-auto flex max-w-4xl items-center justify-between p-4 md:px-6 md:py-5">
          <InstitutionLogoLink size="md" />
          <Link href="/catalogo">
            <Button variant="outline" size="sm" className="border-brand-200 hover:bg-brand-50">
              <ArrowLeft className="h-4 w-4" />
              Voltar ao catálogo
            </Button>
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-4xl p-4 md:p-6">
        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-80 w-full" />
          </div>
        ) : !book ? (
          <p className="py-12 text-center text-slate-500">Livro não encontrado.</p>
        ) : (
          <Card>
            <CardContent className="p-5 md:p-8">
              <div className="grid gap-6 md:grid-cols-[220px,1fr]">
                <BookCover
                  title={book.title}
                  coverImageUrl={book.coverImageUrl}
                  className="mx-auto h-72 w-52 md:mx-0"
                />
                <div>
                  <h1 className="text-2xl font-bold text-slate-900">{book.title}</h1>
                  {book.subtitle && <p className="mt-1 text-slate-600">{book.subtitle}</p>}
                  <p className="mt-2 text-slate-700">{formatBookCredit(book.author, book.medium)}</p>

                  <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-500">
                    {book.collection && <span>{book.collection}</span>}
                    {book.year && <span>Ano: {book.year}</span>}
                  </div>

                  <div className="mt-4">
                    <Badge variant={book.availableCopies > 0 ? "success" : "warning"}>
                      {book.availableCopies > 0
                        ? `${book.availableCopies} disponível(is)`
                        : "Indisponível"}
                    </Badge>
                  </div>

                  <div className="mt-6">
                    <h2 className="text-lg font-semibold text-slate-900">Sinopse</h2>
                    <p className="mt-2 whitespace-pre-line leading-7 text-slate-700">
                      {book.synopsis?.trim() || "Sinopse ainda não cadastrada para esta obra."}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
      <PublicFooter />
    </div>
  );
}
