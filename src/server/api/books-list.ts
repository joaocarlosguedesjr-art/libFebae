import { auth } from "@/lib/auth";
import {
  BOOK_PAGE_MAX_AUTH,
  BOOK_PAGE_MAX_PUBLIC,
  bookInputToPrismaData,
  buildBookSearchWhere,
  parseBookPagination,
} from "@/lib/books";
import { prisma } from "@/lib/prisma";
import { enforceRateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { bookSchema } from "@/lib/validations";
import { sanitizeCoverImageUrl } from "@/lib/safe-image-url";
import { denyUnlessStaff, maybeQueueApproval } from "@/lib/staff-access";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim() ?? "";
  const publicOnly = searchParams.get("public") === "true";

  if (publicOnly) {
    const limited = enforceRateLimit(request, RATE_LIMITS.publicBooks);
    if (limited) return limited;
  } else {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }
  }

  const maxLimit = publicOnly ? BOOK_PAGE_MAX_PUBLIC : BOOK_PAGE_MAX_AUTH;
  const { page, limit, skip } = parseBookPagination(searchParams, maxLimit);
  const where = q ? buildBookSearchWhere(q) : undefined;

  const [books, total] = await Promise.all([
    prisma.book.findMany({
      where,
      include: {
        copies: true,
        categories: true,
        _count: { select: { copies: true } },
      },
      orderBy: [{ title: "asc" }],
      skip,
      take: limit,
    }),
    prisma.book.count({ where }),
  ]);

  const items = books.map((book) => ({
    ...book,
    coverImageUrl: sanitizeCoverImageUrl(book.coverImageUrl),
    availableCopies: book.copies.filter((c) => c.status === "AVAILABLE").length,
  }));

  const body = {
    items,
    total,
    page,
    limit,
    hasMore: skip + items.length < total,
  };

  const headers: HeadersInit = publicOnly
    ? { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120" }
    : {};

  return NextResponse.json(body, { headers });
}

export async function POST(request: Request) {
  const session = await auth();
  const denied = denyUnlessStaff(session);
  if (denied) return denied;

  const body = await request.json();
  const parsed = bookSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Dados inválidos" },
      { status: 400 }
    );
  }

  const queued = await maybeQueueApproval({
    session: session!,
    type: "BOOK_CREATE",
    payload: parsed.data,
    summary: `Cadastrar livro: ${parsed.data.title}`,
  });
  if (queued) return queued;

  const book = await prisma.book.create({
    data: bookInputToPrismaData(parsed.data),
    include: { copies: true, categories: true },
  });

  return NextResponse.json(
    {
      ...book,
      coverImageUrl: sanitizeCoverImageUrl(book.coverImageUrl),
    },
    { status: 201 },
  );
}
