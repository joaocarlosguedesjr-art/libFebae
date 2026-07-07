import { confirmEmailVerification } from "@/lib/email-verification";
import { enforceRateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { signupVerifySchema } from "@/lib/validations";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const limited = enforceRateLimit(request, RATE_LIMITS.signupConfirm);
  if (limited) return limited;
  const body = await request.json();
  const parsed = signupVerifySchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Dados inválidos" },
      { status: 400 }
    );
  }

  try {
    const user = await confirmEmailVerification(
      parsed.data.verificationId,
      parsed.data.code
    );
    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro na verificação" },
      { status: 400 }
    );
  }
}
