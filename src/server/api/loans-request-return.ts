import { auth } from "@/lib/auth";
import { requestReturnLoan } from "@/lib/loans";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

type Params = { params: Promise<{ id: string }> };

/** Leitor (ou admin) solicita devolução — ainda não libera o exemplar. */
export async function POST(_request: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const { id } = await params;
  const loan = await prisma.loan.findUnique({
    where: { id },
    select: { userId: true },
  });

  if (!loan) {
    return NextResponse.json({ error: "Empréstimo não encontrado" }, { status: 404 });
  }

  if (session.user.role !== "ADMIN" && loan.userId !== session.user.id) {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }

  try {
    const updated = await requestReturnLoan(id);
    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Erro ao solicitar devolução",
      },
      { status: 400 },
    );
  }
}
