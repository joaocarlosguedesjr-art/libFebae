import { resendPasswordReset } from "@/lib/password-reset";
import { enforceRateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { signupResendSchema } from "@/lib/validations";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const limited = enforceRateLimit(request, RATE_LIMITS.passwordResetResend);
  if (limited) return limited;

  const body = await request.json();
  const parsed = signupResendSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Dados inválidos" },
      { status: 400 },
    );
  }

  try {
    const result = await resendPasswordReset(parsed.data.verificationId);
    return NextResponse.json({ message: "Novo código enviado", ...result });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro ao reenviar" },
      { status: 400 },
    );
  }
}
