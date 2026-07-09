import { auth } from "@/lib/auth";
import { bookInputToPrismaData } from "@/lib/books";
import { prisma } from "@/lib/prisma";
import { bookSchema } from "@/lib/validations";
import { sanitizeCoverImageUrl } from "@/lib/safe-image-url";
import { NextResponse } from "next/server";

type Params = { params: Promise<{ id: string }> };

export async function GET(request: Request, { params }: Params) {
  const { searchParams } = new URL(request.url);
  const { id } = await params;
  const publicOnly = searchParams.get("public") === "true";
  const session = publicOnly ? null : await auth();

  const book = await prisma.book.findUnique({
    where: { id },
    include: {
      copies: { orderBy: { code: "asc" } },
      categories: true,
    },
  });

  if (!book) {
    return NextResponse.json({ error: "Livro não encontrado" }, { status: 404 });
  }

  if (!publicOnly && !session?.user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  if (publicOnly) {
    return NextResponse.json({
      id: book.id,
      title: book.title,
      subtitle: book.subtitle,
      author: book.author,
      medium: book.medium,
      synopsis: book.synopsis,
      year: book.year,
      collection: book.collection,
      coverImageUrl: sanitizeCoverImageUrl(book.coverImageUrl),
      availableCopies: book.copies.filter((copy) => copy.status === "AVAILABLE").length,
    });
  }

  return NextResponse.json({ ...book, coverImageUrl: sanitizeCoverImageUrl(book.coverImageUrl) });
}

export async function PUT(request: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json();
  const parsed = bookSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Dados inválidos" },
      { status: 400 }
    );
  }

  const prismaData = bookInputToPrismaData(parsed.data);
  const { categories, ...bookData } = prismaData;

  const book = await prisma.book.update({
    where: { id },
    data: {
      ...bookData,
      categories: categories
        ? {
            set: [],
            connectOrCreate: categories.connectOrCreate,
          }
        : undefined,
    },
    include: { copies: true, categories: true },
  });

  return NextResponse.json({
    ...book,
    coverImageUrl: sanitizeCoverImageUrl(book.coverImageUrl),
  });
}

export async function DELETE(_request: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }

  const { id } = await params;

  await prisma.book.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
