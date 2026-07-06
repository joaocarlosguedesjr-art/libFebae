import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { maybeSyncOverdueLoans } from "@/lib/loans";
import { countPendingLoanRequests } from "@/lib/loan-requests";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }

  await maybeSyncOverdueLoans();

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const [totalBooks, totalCopies, totalUsers, activeLoans, overdueLoans, loansToday, pendingRequests] =
    await Promise.all([
      prisma.book.count(),
      prisma.copy.count(),
      prisma.user.count({ where: { role: "READER" } }),
      prisma.loan.count({ where: { status: "ACTIVE" } }),
      prisma.loan.count({ where: { status: "OVERDUE" } }),
      prisma.loan.count({
        where: {
          loanDate: { gte: today, lt: tomorrow },
        },
      }),
      countPendingLoanRequests(),
    ]);

  return NextResponse.json({
    totalBooks,
    totalCopies,
    totalUsers,
    activeLoans,
    overdueLoans,
    loansToday,
    pendingLoanRequests: pendingRequests,
  });
}
