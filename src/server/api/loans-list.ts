import { auth } from "@/lib/auth";
import { maskCpf } from "@/lib/lgpd";
import { prisma } from "@/lib/prisma";
import { createLoan, maybeSyncOverdueLoans } from "@/lib/loans";
import { loanSchema } from "@/lib/validations";
import { isStaff } from "@/lib/roles";
import { denyUnlessStaff } from "@/lib/staff-access";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  await maybeSyncOverdueLoans();

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const circulating = searchParams.get("circulating") === "true";
  const userId =
    isStaff(session.user.role)
      ? searchParams.get("userId")
      : session.user.id;

  const statusFilter = circulating
    ? { status: { in: ["ACTIVE" as const, "OVERDUE" as const, "RETURN_REQUESTED" as const] } }
    : status
      ? { status: status as "ACTIVE" | "RETURNED" | "OVERDUE" | "RETURN_REQUESTED" }
      : {};

  const loans = await prisma.loan.findMany({
    where: {
      ...(userId ? { userId } : {}),
      ...statusFilter,
    },
    include: {
      copy: { include: { book: true } },
      user: { select: { id: true, name: true, email: true, cpf: true } },
    },
    orderBy: { loanDate: "desc" },
  });

  const sanitized = loans.map((loan) => ({
    ...loan,
    user: {
      ...loan.user,
      cpf: loan.user.cpf ? maskCpf(loan.user.cpf) : null,
    },
  }));

  return NextResponse.json(sanitized);
}

export async function POST(request: Request) {
  const session = await auth();
  const denied = denyUnlessStaff(session);
  if (denied) return denied;

  const body = await request.json();
  const parsed = loanSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Dados inválidos" },
      { status: 400 }
    );
  }

  try {
    const dueDate = parsed.data.dueDate ? new Date(parsed.data.dueDate) : undefined;
    const loan = await createLoan(parsed.data.copyId, parsed.data.userId, dueDate);
    return NextResponse.json(loan, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro ao criar empréstimo" },
      { status: 400 }
    );
  }
}
