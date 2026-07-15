import { auth } from "@/lib/auth";
import { resendEmailVerification } from "@/lib/email-verification";
import { signupResendSchema } from "@/lib/validations";
import { denyUnlessStaff } from "@/lib/staff-access";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const session = await auth();
  const denied = denyUnlessStaff(session);
  if (denied) return denied;

  const body = await request.json();
  const parsed = signupResendSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Dados inválidos" },
      { status: 400 }
    );
  }

  try {
    const result = await resendEmailVerification(parsed.data.verificationId, {
      adminId: session!.user.id,
    });
    return NextResponse.json({
      message: "Novo código enviado",
      ...result,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro ao reenviar código" },
      { status: 400 }
    );
  }
}
