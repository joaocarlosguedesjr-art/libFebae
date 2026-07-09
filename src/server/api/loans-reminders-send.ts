import { auth } from "@/lib/auth";
import { sendDueSoonLoanReminders } from "@/lib/loans";
import { NextResponse } from "next/server";

export async function POST() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }

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
