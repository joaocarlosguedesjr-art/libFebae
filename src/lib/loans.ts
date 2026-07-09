import { prisma } from "./prisma";
import { addDays } from "./utils";
import { CopyStatus, LoanStatus } from "@/generated/prisma";
import { createLoanActionToken } from "@/lib/loan-action-token";
import { getAppBaseUrl } from "@/lib/branding";
import { sendLoanReminderEmail } from "@/lib/email";

const RENEW_WINDOW_DAYS = 2;

function startOfDay(date: Date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function canRenewLoan(dueDate: Date) {
  const now = startOfDay(new Date());
  const due = startOfDay(dueDate);
  const diffMs = due.getTime() - now.getTime();
  const remainingDays = Math.ceil(diffMs / (24 * 60 * 60 * 1000));
  return remainingDays <= RENEW_WINDOW_DAYS;
}

export async function getLoanDaysDefault() {
  const config = await prisma.appConfig.findUnique({
    where: { id: "default" },
  });
  return config?.loanDaysDefault ?? 14;
}

export async function createLoan(copyId: string, userId: string, dueDate?: Date) {
  const copy = await prisma.copy.findUnique({
    where: { id: copyId },
    include: { book: true },
  });

  if (!copy) {
    throw new Error("Exemplar não encontrado");
  }

  if (copy.status !== CopyStatus.AVAILABLE) {
    throw new Error("Exemplar não está disponível para empréstimo");
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new Error("Leitor não encontrado");
  }

  const loanDays = await getLoanDaysDefault();
  const finalDueDate = dueDate ?? addDays(new Date(), loanDays);

  const loan = await prisma.$transaction(async (tx) => {
    const created = await tx.loan.create({
      data: {
        copyId,
        userId,
        dueDate: finalDueDate,
        status: LoanStatus.ACTIVE,
      },
      include: {
        copy: { include: { book: true } },
        user: true,
      },
    });

    await tx.copy.update({
      where: { id: copyId },
      data: { status: CopyStatus.LOANED },
    });

    return created;
  });

  return loan;
}

export async function requestReturnLoan(loanId: string) {
  const loan = await prisma.loan.findUnique({
    where: { id: loanId },
    include: {
      copy: { include: { book: true } },
      user: true,
    },
  });

  if (!loan) {
    throw new Error("Empréstimo não encontrado");
  }

  if (loan.status === LoanStatus.RETURNED) {
    throw new Error("Empréstimo já foi devolvido");
  }

  if (loan.status === LoanStatus.RETURN_REQUESTED) {
    return loan;
  }

  if (loan.status !== LoanStatus.ACTIVE && loan.status !== LoanStatus.OVERDUE) {
    throw new Error("Este empréstimo não pode solicitar devolução");
  }

  return prisma.loan.update({
    where: { id: loanId },
    data: { status: LoanStatus.RETURN_REQUESTED },
    include: {
      copy: { include: { book: true } },
      user: true,
    },
  });
}

/** Confirma devolução física — somente via admin. */
export async function confirmReturnLoan(loanId: string) {
  const loan = await prisma.loan.findUnique({
    where: { id: loanId },
    include: { copy: true },
  });

  if (!loan) {
    throw new Error("Empréstimo não encontrado");
  }

  if (loan.status === LoanStatus.RETURNED) {
    throw new Error("Empréstimo já foi devolvido");
  }

  if (
    loan.status !== LoanStatus.ACTIVE &&
    loan.status !== LoanStatus.OVERDUE &&
    loan.status !== LoanStatus.RETURN_REQUESTED
  ) {
    throw new Error("Este empréstimo não pode ser devolvido");
  }

  return prisma.$transaction(async (tx) => {
    const updated = await tx.loan.update({
      where: { id: loanId },
      data: {
        returnDate: new Date(),
        status: LoanStatus.RETURNED,
      },
      include: {
        copy: { include: { book: true } },
        user: true,
      },
    });

    await tx.copy.update({
      where: { id: loan.copyId },
      data: { status: CopyStatus.AVAILABLE },
    });

    return updated;
  });
}

/** @deprecated Use confirmReturnLoan — mantido para compatibilidade de imports. */
export const returnLoan = confirmReturnLoan;

export async function renewLoan(loanId: string) {
  const loan = await prisma.loan.findUnique({
    where: { id: loanId },
    include: {
      copy: { include: { book: true } },
      user: true,
    },
  });

  if (!loan) {
    throw new Error("Empréstimo não encontrado");
  }

  if (loan.status !== LoanStatus.ACTIVE) {
    throw new Error("Somente empréstimos ativos podem ser renovados");
  }

  if (!canRenewLoan(loan.dueDate)) {
    throw new Error("Renovação disponível apenas quando faltarem 2 dias para o vencimento");
  }

  const loanDays = await getLoanDaysDefault();
  const updated = await prisma.loan.update({
    where: { id: loanId },
    data: {
      dueDate: addDays(loan.dueDate, loanDays),
    },
    include: {
      copy: { include: { book: true } },
      user: true,
    },
  });

  return updated;
}

export async function sendDueSoonLoanReminders() {
  const now = new Date();
  const limitDate = addDays(now, RENEW_WINDOW_DAYS);
  const baseUrl = getAppBaseUrl();

  const loans = await prisma.loan.findMany({
    where: {
      status: LoanStatus.ACTIVE,
      dueDate: { gte: now, lte: limitDate },
    },
    include: {
      copy: { include: { book: true } },
      user: { select: { id: true, name: true, email: true } },
    },
    orderBy: { dueDate: "asc" },
  });

  let sent = 0;
  for (const loan of loans) {
    const renewToken = createLoanActionToken({
      loanId: loan.id,
      userId: loan.user.id,
      action: "renew",
    });
    const returnToken = createLoanActionToken({
      loanId: loan.id,
      userId: loan.user.id,
      action: "request-return",
    });

    await sendLoanReminderEmail({
      to: loan.user.email,
      name: loan.user.name,
      title: loan.copy.book.title,
      dueDate: loan.dueDate,
      renewUrl: `${baseUrl}/api/loans/action?token=${encodeURIComponent(renewToken)}`,
      returnUrl: `${baseUrl}/api/loans/action?token=${encodeURIComponent(returnToken)}`,
      loansUrl: `${baseUrl}/emprestimos`,
    });
    sent += 1;
  }

  return { sent, total: loans.length };
}

export async function syncOverdueLoans() {
  const now = new Date();
  await prisma.loan.updateMany({
    where: {
      status: LoanStatus.ACTIVE,
      dueDate: { lt: now },
    },
    data: { status: LoanStatus.OVERDUE },
  });
}

const OVERDUE_SYNC_INTERVAL_MS = 5 * 60 * 1000;
let lastOverdueSyncAt = 0;

/** Evita escrita no banco em todo GET de empréstimos/estatísticas */
export async function maybeSyncOverdueLoans() {
  const now = Date.now();
  if (now - lastOverdueSyncAt < OVERDUE_SYNC_INTERVAL_MS) return;
  lastOverdueSyncAt = now;
  await syncOverdueLoans();
}
