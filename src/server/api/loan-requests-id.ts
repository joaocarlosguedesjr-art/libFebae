import { auth } from "@/lib/auth";
import {
  approveLoanRequest,
  cancelLoanRequest,
  rejectLoanRequest,
} from "@/lib/loan-requests";
import { loanRequestReviewSchema } from "@/lib/validations";
import { NextResponse } from "next/server";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }

  const { id } = await context.params;
  const body = await request.json();
  const parsed = loanRequestReviewSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Dados inválidos" },
      { status: 400 }
    );
  }

  const { action, copyId, adminNote, dueDate } = parsed.data;

  try {
    if (action === "approve") {
      if (!copyId) {
        return NextResponse.json({ error: "Selecione um exemplar" }, { status: 400 });
      }
      const result = await approveLoanRequest(
        id,
        session.user.id,
        copyId,
        dueDate ? new Date(dueDate) : undefined
      );
      return NextResponse.json(result);
    }

    const result = await rejectLoanRequest(id, session.user.id, adminNote);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro ao analisar solicitação" },
      { status: 400 }
    );
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const { id } = await context.params;

  try {
    const result = await cancelLoanRequest(id, session.user.id);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro ao cancelar" },
      { status: 400 }
    );
  }
}
