"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { BookOpen, Check, ChevronLeft, User } from "lucide-react";
import { SearchBar } from "@/components/search-bar";
import { BookCover } from "@/components/books/book-cover";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { DateInput, isDueDateNotBeforeToday } from "@/components/ui/date-input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { BOOK_PAGE_CATALOG } from "@/lib/books";
import { fetchBooksPage } from "@/lib/client-books";
import { formatBookCredit } from "@/lib/spiritist";
import { Pagination } from "@/components/ui/pagination";
import { cn } from "@/lib/utils";

type UserOption = { id: string; name: string; email: string; cpf: string | null };
type CatalogBook = {
  id: string;
  title: string;
  subtitle: string | null;
  author: string;
  medium: string | null;
  year: number | null;
  collection: string | null;
  coverImageUrl: string | null;
  availableCopies: number;
};
type CopyOption = {
  id: string;
  code: string;
  book: { title: string; author: string };
};

const STEPS = [
  { id: 1, label: "Leitor", icon: User },
  { id: 2, label: "Catálogo", icon: BookOpen },
  { id: 3, label: "Confirmar", icon: Check },
] as const;

export function AdminDirectLoanWizard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialBookId = searchParams.get("bookId")?.trim() ?? "";
  const initialUserId = searchParams.get("userId")?.trim() ?? "";

  const [step, setStep] = useState(() => {
    if (initialUserId && initialBookId) return 3;
    if (initialUserId) return 2;
    return 1;
  });
  const [submitting, setSubmitting] = useState(false);

  const [userQuery, setUserQuery] = useState("");
  const [users, setUsers] = useState<UserOption[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [userId, setUserId] = useState(initialUserId);

  const [bookQuery, setBookQuery] = useState("");
  const [books, setBooks] = useState<CatalogBook[]>([]);
  const [booksTotal, setBooksTotal] = useState(0);
  const [bookPage, setBookPage] = useState(1);
  const [booksLoading, setBooksLoading] = useState(false);
  const [bookId, setBookId] = useState(initialBookId);
  const [selectedBook, setSelectedBook] = useState<CatalogBook | null>(null);

  const [copies, setCopies] = useState<CopyOption[]>([]);
  const [copiesLoading, setCopiesLoading] = useState(false);
  const [copyId, setCopyId] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [dueDateError, setDueDateError] = useState("");

  const pageSize = BOOK_PAGE_CATALOG;
  const totalBookPages = Math.max(1, Math.ceil(booksTotal / pageSize));
  const selectedUser = users.find((u) => u.id === userId);

  const loadUsers = useCallback(async (q: string) => {
    setUsersLoading(true);
    const params = new URLSearchParams();
    if (q.trim()) params.set("q", q.trim());
    const res = await fetch(`/api/users?${params}`);
    if (res.ok) {
      const data = (await res.json()) as (UserOption & { role: string })[];
      setUsers(data.filter((u) => u.role === "READER"));
    }
    setUsersLoading(false);
  }, []);

  const loadBooks = useCallback(async () => {
    setBooksLoading(true);
    const params = new URLSearchParams();
    if (bookQuery.trim()) params.set("q", bookQuery.trim());
    try {
      const result = await fetchBooksPage<CatalogBook>(params, {
        page: bookPage,
        pageSize,
      });
      setBooks(result.items);
      setBooksTotal(result.total);
    } catch {
      setBooks([]);
      setBooksTotal(0);
    }
    setBooksLoading(false);
  }, [bookQuery, bookPage, pageSize]);

  const loadCopies = useCallback(async (targetBookId: string) => {
    setCopiesLoading(true);
    const res = await fetch(
      `/api/copies?bookId=${encodeURIComponent(targetBookId)}&available=true`,
    );
    if (res.ok) {
      const data = (await res.json()) as CopyOption[];
      setCopies(data);
      setCopyId(data.length === 1 ? data[0].id : "");
    } else {
      setCopies([]);
      setCopyId("");
    }
    setCopiesLoading(false);
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => loadUsers(userQuery), 250);
    return () => clearTimeout(timeout);
  }, [userQuery, loadUsers]);

  useEffect(() => {
    const timeout = setTimeout(loadBooks, 300);
    return () => clearTimeout(timeout);
  }, [loadBooks]);

  useEffect(() => {
    setBookPage(1);
  }, [bookQuery]);

  useEffect(() => {
    if (!bookId) {
      setSelectedBook(null);
      setCopies([]);
      setCopyId("");
      return;
    }
    const fromList = books.find((b) => b.id === bookId);
    if (fromList) setSelectedBook(fromList);
    void loadCopies(bookId);
  }, [bookId, books, loadCopies]);

  useEffect(() => {
    if (!initialBookId || selectedBook) return;
    const fromList = books.find((b) => b.id === initialBookId);
    if (fromList) {
      setSelectedBook(fromList);
      return;
    }
    void fetch(`/api/books/${initialBookId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then(
        (
          book: (CatalogBook & { copies?: { status: string }[] }) | null,
        ) => {
          if (!book) return;
          const availableCopies =
            book.availableCopies ??
            book.copies?.filter((c) => c.status === "AVAILABLE").length ??
            0;
          setSelectedBook({ ...book, availableCopies });
          setBookId(book.id);
        },
      );
  }, [initialBookId, books, selectedBook]);

  function selectBook(book: CatalogBook) {
    if (book.availableCopies === 0) {
      toast.error("Não há exemplares disponíveis desta obra");
      return;
    }
    setBookId(book.id);
    setSelectedBook(book);
    setStep(3);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!userId || !copyId) {
      toast.error("Selecione leitor e exemplar");
      return;
    }

    if (dueDate && !isDueDateNotBeforeToday(dueDate)) {
      setDueDateError("A data de devolução não pode ser anterior a hoje");
      toast.error("A data de devolução não pode ser anterior a hoje");
      return;
    }

    setSubmitting(true);
    const res = await fetch("/api/loans", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId,
        copyId,
        dueDate: dueDate || undefined,
      }),
    });
    setSubmitting(false);

    if (!res.ok) {
      const err = await res.json();
      toast.error(err.error ?? "Erro ao registrar empréstimo");
      return;
    }

    toast.success("Empréstimo registrado!");
    router.push("/emprestimos");
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {STEPS.map((s) => {
          const Icon = s.icon;
          const active = step === s.id;
          const done = step > s.id;
          return (
            <div
              key={s.id}
              className={cn(
                "flex flex-1 items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium",
                active && "border-brand-300 bg-brand-50 text-brand-900",
                done && !active && "border-brand-100 bg-brand-50/50 text-brand-700",
                !active && !done && "border-slate-200 text-slate-500",
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="hidden sm:inline">{s.label}</span>
            </div>
          );
        })}
      </div>

      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Selecionar leitor</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <SearchBar
              placeholder="Buscar por nome, e-mail ou CPF..."
              onSearch={setUserQuery}
            />
            {usersLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-14 w-full" />
                ))}
              </div>
            ) : users.length === 0 ? (
              <p className="py-8 text-center text-sm text-slate-500">Nenhum leitor encontrado.</p>
            ) : (
              <ul className="max-h-80 space-y-2 overflow-y-auto">
                {users.map((user) => (
                  <li key={user.id}>
                    <button
                      type="button"
                      onClick={() => setUserId(user.id)}
                      className={cn(
                        "w-full rounded-lg border px-4 py-3 text-left transition",
                        userId === user.id
                          ? "border-brand-400 bg-brand-50 ring-1 ring-brand-300"
                          : "border-slate-200 hover:border-brand-200 hover:bg-slate-50",
                      )}
                    >
                      <p className="font-medium text-slate-900">{user.name}</p>
                      <p className="text-xs text-slate-500">
                        {user.email}
                        {user.cpf ? ` · ${user.cpf}` : ""}
                      </p>
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <Button className="w-full sm:w-auto" disabled={!userId} onClick={() => setStep(2)}>
              Continuar para o catálogo
            </Button>
          </CardContent>
        </Card>
      )}

      {step === 2 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2">
            <CardTitle>Selecionar obra no catálogo</CardTitle>
            <Button type="button" variant="ghost" size="sm" onClick={() => setStep(1)}>
              <ChevronLeft className="h-4 w-4" />
              Leitor
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {selectedUser && (
              <p className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700">
                Emprestando para: <strong>{selectedUser.name}</strong>
              </p>
            )}
            <SearchBar
              placeholder="Buscar por título, autor, ISBN..."
              onSearch={setBookQuery}
            />
            {booksLoading ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-28 w-full" />
                ))}
              </div>
            ) : books.length === 0 ? (
              <p className="py-8 text-center text-sm text-slate-500">Nenhuma obra encontrada.</p>
            ) : (
              <ul className="grid gap-3 sm:grid-cols-2">
                {books.map((book) => (
                  <li key={book.id}>
                    <button
                      type="button"
                      onClick={() => selectBook(book)}
                      disabled={book.availableCopies === 0}
                      className={cn(
                        "flex w-full gap-3 rounded-lg border p-3 text-left transition",
                        book.availableCopies === 0
                          ? "cursor-not-allowed border-slate-100 bg-slate-50 opacity-60"
                          : "border-slate-200 hover:border-brand-300 hover:bg-brand-50/40",
                        bookId === book.id && "border-brand-400 ring-1 ring-brand-300",
                      )}
                    >
                      <BookCover
                        title={book.title}
                        coverImageUrl={book.coverImageUrl}
                        className="h-20 w-14 shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="line-clamp-2 font-medium text-slate-900">{book.title}</p>
                        <p className="mt-0.5 text-xs text-slate-600">
                          {formatBookCredit(book.author, book.medium)}
                        </p>
                        <Badge
                          variant={book.availableCopies > 0 ? "success" : "warning"}
                          className="mt-2"
                        >
                          {book.availableCopies > 0
                            ? `${book.availableCopies} disponível(is)`
                            : "Indisponível"}
                        </Badge>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <Pagination
              page={bookPage}
              totalPages={totalBookPages}
              totalItems={booksTotal}
              pageSize={pageSize}
              onPageChange={setBookPage}
            />
          </CardContent>
        </Card>
      )}

      {step === 3 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2">
            <CardTitle>Confirmar empréstimo</CardTitle>
            <Button type="button" variant="ghost" size="sm" onClick={() => setStep(2)}>
              <ChevronLeft className="h-4 w-4" />
              Catálogo
            </Button>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm">
                <p>
                  <span className="font-medium text-slate-700">Leitor:</span>{" "}
                  {selectedUser?.name ?? "—"}
                </p>
                <p className="mt-1">
                  <span className="font-medium text-slate-700">Obra:</span>{" "}
                  {selectedBook?.title ?? "—"}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="copyId">Exemplar *</Label>
                {copiesLoading ? (
                  <Skeleton className="h-10 w-full" />
                ) : copies.length === 0 ? (
                  <p className="text-sm text-red-600">
                    Nenhum exemplar disponível. Volte e escolha outra obra.
                  </p>
                ) : (
                  <select
                    id="copyId"
                    value={copyId}
                    onChange={(e) => setCopyId(e.target.value)}
                    required
                    className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm"
                  >
                    <option value="">Escolha o exemplar...</option>
                    {copies.map((copy) => (
                      <option key={copy.id} value={copy.id}>
                        {copy.code}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="dueDate">Data de devolução (opcional)</Label>
                <DateInput
                  id="dueDate"
                  value={dueDate}
                  onChange={(e) => {
                    const value = e.target.value;
                    setDueDate(value);
                    if (value && !isDueDateNotBeforeToday(value)) {
                      setDueDateError("A data de devolução não pode ser anterior a hoje");
                    } else {
                      setDueDateError("");
                    }
                  }}
                  error={dueDateError}
                  hint={dueDateError ? undefined : "Padrão: 14 dias a partir de hoje"}
                />
              </div>

              <Button
                type="submit"
                className="w-full sm:w-auto"
                disabled={submitting || !userId || !copyId || !!dueDateError}
              >
                {submitting ? "Emprestando..." : "Confirmar empréstimo"}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
