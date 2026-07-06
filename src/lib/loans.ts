import { prisma } from "./prisma";
import { addDays } from "./utils";
import { CopyStatus, LoanStatus } from "@/generated/prisma";

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

export async function returnLoan(loanId: string) {
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
