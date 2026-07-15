import { auth } from "@/lib/auth";
import { requestEmailVerification } from "@/lib/email-verification";
import { enforceRateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { signupRequestSchema } from "@/lib/validations";
import { denyUnlessStaff } from "@/lib/staff-access";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const session = await auth();
  const denied = denyUnlessStaff(session);
  if (denied) return denied;

  const limited = enforceRateLimit(request, RATE_LIMITS.adminEmailSend);
  if (limited) return limited;

  const body = await request.json();
  const parsed = signupRequestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Dados inválidos" },
      { status: 400 }
    );
  }

  const { cpf, dataSubjectInformed: _i, consentConfirmed: _c, ...data } = parsed.data;

  try {
    const result = await requestEmailVerification(
      data.email,
      {
        name: data.name,
        password: data.password,
        cpf: cpf || null,
        role: data.role,
        consentMethod: "ADMIN_REGISTRATION",
        adminId: session!.user.id,
      },
      session!.user.id
    );

    return NextResponse.json({
      message: "Código enviado para o e-mail informado",
      ...result,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro ao enviar código" },
      { status: 400 }
    );
  }
}
