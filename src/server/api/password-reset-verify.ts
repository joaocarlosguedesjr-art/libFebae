import { verifyPasswordResetCode } from "@/lib/password-reset";
import { enforceRateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { signupVerifySchema } from "@/lib/validations";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const limited = enforceRateLimit(request, RATE_LIMITS.passwordResetVerify);
  if (limited) return limited;

  const body = await request.json();
  const parsed = signupVerifySchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Dados inválidos" },
      { status: 400 },
    );
  }

  try {
    const result = await verifyPasswordResetCode(
      parsed.data.verificationId,
      parsed.data.code,
    );
    return NextResponse.json({ message: "Código confirmado", ...result });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Código inválido" },
      { status: 400 },
    );
  }
}
