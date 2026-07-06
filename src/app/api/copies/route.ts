import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { copySchema } from "@/lib/validations";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const bookId = searchParams.get("bookId");
  const available = searchParams.get("available") === "true";

  const copies = await prisma.copy.findMany({
    where: {
      ...(bookId ? { bookId } : {}),
      ...(available ? { status: "AVAILABLE" } : {}),
    },
    include: { book: true },
    orderBy: { code: "asc" },
  });

  return NextResponse.json(copies);
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }

  const body = await request.json();
  const parsed = copySchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Dados inválidos" },
      { status: 400 }
    );
  }

  const copy = await prisma.copy.create({
    data: parsed.data,
    include: { book: true },
  });

  return NextResponse.json(copy, { status: 201 });
}
