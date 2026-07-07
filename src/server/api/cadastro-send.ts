import { requestEmailVerification } from "@/lib/email-verification";
import { enforceRateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { selfSignupRequestSchema } from "@/lib/validations";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const ipLimited = enforceRateLimit(request, RATE_LIMITS.signupSendIp);
  if (ipLimited) return ipLimited;

  const limited = enforceRateLimit(request, RATE_LIMITS.signupSend);
  if (limited) return limited;
  const body = await request.json();
  const parsed = selfSignupRequestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Dados inválidos" },
      { status: 400 }
    );
  }

  const { cpf, dataSubjectInformed: _i, consentConfirmed: _c, ...data } = parsed.data;

  try {
    const result = await requestEmailVerification(data.email, {
      name: data.name,
      password: data.password,
      cpf: cpf || null,
      role: "READER",
      consentMethod: "SELF_ACCEPTANCE",
    });

    return NextResponse.json({
      message: "Código enviado para o seu e-mail",
      ...result,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro ao enviar código" },
      { status: 400 }
    );
  }
}
