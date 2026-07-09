import { completePasswordReset } from "@/lib/password-reset";
import { enforceRateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { passwordResetCompleteSchema } from "@/lib/validations";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const limited = enforceRateLimit(request, RATE_LIMITS.passwordResetComplete);
  if (limited) return limited;

  const body = await request.json();
  const parsed = passwordResetCompleteSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Dados inválidos" },
      { status: 400 },
    );
  }

  try {
    await completePasswordReset(parsed.data.verificationId, parsed.data.password);
    return NextResponse.json({ message: "Senha redefinida com sucesso" });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro ao redefinir senha" },
      { status: 400 },
    );
  }
}
