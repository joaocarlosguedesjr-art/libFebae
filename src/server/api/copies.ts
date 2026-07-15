import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { copySchema } from "@/lib/validations";
import { denyUnlessStaff, maybeQueueApproval } from "@/lib/staff-access";
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
  const denied = denyUnlessStaff(session);
  if (denied) return denied;

  const body = await request.json();
  const parsed = copySchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Dados inválidos" },
      { status: 400 }
    );
  }

  const book = await prisma.book.findUnique({
    where: { id: parsed.data.bookId },
    select: { title: true },
  });

  const queued = await maybeQueueApproval({
    session: session!,
    type: "COPY_CREATE",
    payload: parsed.data,
    summary: `Novo exemplar ${parsed.data.code}${book ? ` — ${book.title}` : ""}`,
    entityId: parsed.data.bookId,
  });
  if (queued) return queued;

  const copy = await prisma.copy.create({
    data: parsed.data,
    include: { book: true },
  });

  return NextResponse.json(copy, { status: 201 });
}
