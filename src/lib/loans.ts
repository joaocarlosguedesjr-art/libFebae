import { prisma } from "./prisma";
import { addDays } from "./utils";
import { CopyStatus, LoanStatus } from "@/generated/prisma";
import { createLoanActionToken } from "@/lib/loan-action-token";
import { getAppBaseUrl } from "@/lib/branding";
import {
  notifyInBackground,
  sendLoanConfirmationEmail,
  sendLoanReminderEmail,
  sendLoanReturnConfirmationEmail,
} from "@/lib/email";

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
  return remainingDays >= 0 && remainingDays <= RENEW_WINDOW_DAYS;
}

function notifyLoanCreated(loan: {
  user: { name: string; email: string };
  copy: { code: string; book: { title: string; author: string } };
  loanDate: Date;
  dueDate: Date;
}) {
  notifyInBackground(() =>
    sendLoanConfirmationEmail({
      to: loan.user.email,
      name: loan.user.name,
      title: loan.copy.book.title,
      author: loan.copy.book.author,
      copyCode: loan.copy.code,
      loanDate: loan.loanDate,
      dueDate: loan.dueDate,
    }),
  );
}

function notifyLoanReturned(loan: {
  user: { name: string; email: string };
  copy: { code: string; book: { title: string; author: string } };
  returnDate: Date | null;
}) {
  if (!loan.returnDate) return;

  notifyInBackground(() =>
    sendLoanReturnConfirmationEmail({
      to: loan.user.email,
      name: loan.user.name,
      title: loan.copy.book.title,
      author: loan.copy.book.author,
      copyCode: loan.copy.code,
      returnDate: loan.returnDate!,
    }),
  );
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

  if (dueDate) {
    const chosen = startOfDay(dueDate);
    const today = startOfDay(new Date());
    if (chosen < today) {
      throw new Error("A data de devolução não pode ser anterior a hoje");
    }
  }

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

  notifyLoanCreated(loan);
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

/** Confirma devolução física — somente via staff. */
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

  const updated = await prisma.$transaction(async (tx) => {
    const result = await tx.loan.update({
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

    return result;
  });

  notifyLoanReturned(updated);
  return updated;
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
      dueReminderSentAt: null,
    },
    include: {
      copy: { include: { book: true } },
      user: true,
    },
  });

  return updated;
}

async function sendReminderForLoan(loan: {
  id: string;
  dueDate: Date;
  user: { id: string; name: string; email: string };
  copy: { book: { title: string } };
}) {
  const baseUrl = getAppBaseUrl();
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

  await prisma.loan.update({
    where: { id: loan.id },
    data: { dueReminderSentAt: new Date() },
  });
}

export async function sendDueSoonLoanReminders() {
  const loans = await prisma.loan.findMany({
    where: {
      status: LoanStatus.ACTIVE,
      dueReminderSentAt: null,
    },
    include: {
      copy: { include: { book: true } },
      user: { select: { id: true, name: true, email: true } },
    },
    orderBy: { dueDate: "asc" },
  });

  const eligible = loans.filter((loan) => canRenewLoan(loan.dueDate));

  let sent = 0;
  for (const loan of eligible) {
    await sendReminderForLoan(loan);
    sent += 1;
  }

  return { sent, total: eligible.length };
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
const REMINDER_SYNC_INTERVAL_MS = 60 * 60 * 1000;
let lastOverdueSyncAt = 0;
let lastReminderSyncAt = 0;

async function maybeSendDueSoonReminders() {
  const now = Date.now();
  if (now - lastReminderSyncAt < REMINDER_SYNC_INTERVAL_MS) return;
  lastReminderSyncAt = now;

  try {
    await sendDueSoonLoanReminders();
  } catch (error) {
    console.error(
      "[loans] lembrete automático:",
      error instanceof Error ? error.message : error,
    );
  }
}

/** Evita escrita no banco em todo GET de empréstimos/estatísticas */
export async function maybeSyncOverdueLoans() {
  const now = Date.now();
  if (now - lastOverdueSyncAt < OVERDUE_SYNC_INTERVAL_MS) return;
  lastOverdueSyncAt = now;
  await syncOverdueLoans();
  await maybeSendDueSoonReminders();
}
