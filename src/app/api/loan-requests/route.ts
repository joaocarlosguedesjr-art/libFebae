import { auth } from "@/lib/auth";
import { createLoanRequest, listLoanRequests } from "@/lib/loan-requests";
import { loanRequestCreateSchema } from "@/lib/validations";
import type { LoanRequestStatus } from "@/generated/prisma";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") as LoanRequestStatus | null;

  const isAdmin = session.user.role === "ADMIN";
  const requests = await listLoanRequests({
    userId: isAdmin ? undefined : session.user.id,
    status: status ?? undefined,
  });

  return NextResponse.json(requests);
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = loanRequestCreateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Dados inválidos" },
      { status: 400 }
    );
  }

  try {
    const created = await createLoanRequest(
      session.user.id,
      parsed.data.bookId,
      parsed.data.readerNote
    );
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro ao solicitar empréstimo" },
      { status: 400 }
    );
  }
}
