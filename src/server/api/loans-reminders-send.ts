import { auth } from "@/lib/auth";
import { sendDueSoonLoanReminders } from "@/lib/loans";
import { denyUnlessStaff, maybeQueueApproval } from "@/lib/staff-access";
import { NextResponse } from "next/server";

export async function POST() {
  const session = await auth();
  const denied = denyUnlessStaff(session);
  if (denied) return denied;

  const queued = await maybeQueueApproval({
    session: session!,
    type: "LOAN_REMINDER_SEND",
    payload: {},
    summary: "Enviar lembretes de vencimento de empréstimos",
  });
  if (queued) return queued;

  try {
    const result = await sendDueSoonLoanReminders();
    return NextResponse.json({
      message: `${result.sent} lembrete(s) enviados`,
      ...result,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro ao enviar lembretes" },
      { status: 400 },
    );
  }
}
