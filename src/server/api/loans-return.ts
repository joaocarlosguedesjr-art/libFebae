import { auth } from "@/lib/auth";
import { confirmReturnLoan } from "@/lib/loans";
import { prisma } from "@/lib/prisma";
import { denyUnlessStaff, maybeQueueApproval } from "@/lib/staff-access";
import { NextResponse } from "next/server";

type Params = { params: Promise<{ id: string }> };

/** Confirma devolução física — somente admin. */
export async function POST(_request: Request, { params }: Params) {
  const session = await auth();
  const denied = denyUnlessStaff(session);
  if (denied) return denied;

  const { id } = await params;

  const loan = await prisma.loan.findUnique({
    where: { id },
    include: { copy: { include: { book: true } }, user: { select: { name: true } } },
  });

  if (!loan) {
    return NextResponse.json({ error: "Empréstimo não encontrado" }, { status: 404 });
  }

  const queued = await maybeQueueApproval({
    session: session!,
    type: "LOAN_RETURN",
    payload: { loanId: id },
    summary: `Confirmar devolução: ${loan.copy.book.title} — ${loan.user.name}`,
    entityId: id,
  });
  if (queued) return queued;

  try {
    const result = await confirmReturnLoan(id);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro ao devolver" },
      { status: 400 },
    );
  }
}
