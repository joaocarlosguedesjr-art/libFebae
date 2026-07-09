import { requestPasswordReset } from "@/lib/password-reset";
import { enforceRateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { passwordResetRequestSchema } from "@/lib/validations";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const ipLimited = enforceRateLimit(request, RATE_LIMITS.passwordResetSendIp);
  if (ipLimited) return ipLimited;

  const limited = enforceRateLimit(request, RATE_LIMITS.passwordResetSend);
  if (limited) return limited;

  const body = await request.json();
  const parsed = passwordResetRequestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Dados inválidos" },
      { status: 400 },
    );
  }

  try {
    const result = await requestPasswordReset(parsed.data.email);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro ao enviar código" },
      { status: 400 },
    );
  }
}
