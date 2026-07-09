import { prisma } from "@/lib/prisma";
import { createLoan } from "@/lib/loans";
import type { LoanRequestStatus } from "@/generated/prisma";

const requestInclude = {
  book: {
    select: {
      id: true,
      title: true,
      author: true,
      medium: true,
      copies: { select: { id: true, code: true, status: true } },
    },
  },
  user: { select: { id: true, name: true, email: true } },
  reviewedBy: { select: { id: true, name: true } },
  loan: {
    select: {
      id: true,
      dueDate: true,
      copy: { select: { code: true } },
    },
  },
} as const;

export async function createLoanRequest(userId: string, bookId: string, readerNote?: string) {
  const book = await prisma.book.findUnique({
    where: { id: bookId },
    include: { copies: true },
  });

  if (!book) {
    throw new Error("Obra não encontrada");
  }

  const availableCount = book.copies.filter((c) => c.status === "AVAILABLE").length;
  if (availableCount === 0) {
    throw new Error("Não há exemplares disponíveis para esta obra no momento");
  }

  const existingPending = await prisma.loanRequest.findFirst({
    where: { userId, bookId, status: "PENDING" },
  });

  if (existingPending) {
    throw new Error("Você já possui uma solicitação pendente para esta obra");
  }

  const activeLoan = await prisma.loan.findFirst({
    where: {
      userId,
      status: { in: ["ACTIVE", "OVERDUE", "RETURN_REQUESTED"] },
      copy: { bookId },
    },
  });

  if (activeLoan) {
    throw new Error("Você já possui um empréstimo ativo desta obra");
  }

  return prisma.loanRequest.create({
    data: {
      userId,
      bookId,
      readerNote: readerNote?.trim() || null,
    },
    include: requestInclude,
  });
}

export async function listLoanRequests(options: {
  userId?: string;
  status?: LoanRequestStatus;
}) {
  return prisma.loanRequest.findMany({
    where: {
      ...(options.userId ? { userId: options.userId } : {}),
      ...(options.status ? { status: options.status } : {}),
    },
    include: requestInclude,
    orderBy: { createdAt: "desc" },
    take: 100,
  });
}

export async function approveLoanRequest(
  requestId: string,
  adminId: string,
  copyId: string,
  dueDate?: Date
) {
  const request = await prisma.loanRequest.findUnique({
    where: { id: requestId },
    include: { book: { include: { copies: true } } },
  });

  if (!request) throw new Error("Solicitação não encontrada");
  if (request.status !== "PENDING") {
    throw new Error("Esta solicitação já foi analisada");
  }

  const copy = request.book.copies.find((c) => c.id === copyId);
  if (!copy) throw new Error("Exemplar inválido para esta obra");
  if (copy.status !== "AVAILABLE") {
    throw new Error("O exemplar selecionado não está disponível");
  }

  const loan = await createLoan(copyId, request.userId, dueDate);

  return prisma.loanRequest.update({
    where: { id: requestId },
    data: {
      status: "APPROVED",
      reviewedById: adminId,
      reviewedAt: new Date(),
      loanId: loan.id,
    },
    include: requestInclude,
  });
}

export async function rejectLoanRequest(
  requestId: string,
  adminId: string,
  adminNote?: string
) {
  const request = await prisma.loanRequest.findUnique({ where: { id: requestId } });

  if (!request) throw new Error("Solicitação não encontrada");
  if (request.status !== "PENDING") {
    throw new Error("Esta solicitação já foi analisada");
  }

  return prisma.loanRequest.update({
    where: { id: requestId },
    data: {
      status: "REJECTED",
      reviewedById: adminId,
      reviewedAt: new Date(),
      adminNote: adminNote?.trim() || null,
    },
    include: requestInclude,
  });
}

export async function cancelLoanRequest(requestId: string, userId: string) {
  const request = await prisma.loanRequest.findUnique({ where: { id: requestId } });

  if (!request) throw new Error("Solicitação não encontrada");
  if (request.userId !== userId) throw new Error("Acesso negado");
  if (request.status !== "PENDING") {
    throw new Error("Somente solicitações pendentes podem ser canceladas");
  }

  return prisma.loanRequest.update({
    where: { id: requestId },
    data: { status: "CANCELLED" },
    include: requestInclude,
  });
}

export async function countPendingLoanRequests() {
  return prisma.loanRequest.count({ where: { status: "PENDING" } });
}
