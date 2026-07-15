import { auth } from "@/lib/auth";
import {
  confirmEmailVerification,
  validateEmailVerificationForApproval,
} from "@/lib/email-verification";
import { roleLabel } from "@/lib/roles";
import { signupVerifySchema } from "@/lib/validations";
import { denyUnlessStaff, maybeQueueApproval } from "@/lib/staff-access";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const session = await auth();
  const denied = denyUnlessStaff(session);
  if (denied) return denied;

  const body = await request.json();
  const parsed = signupVerifySchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Dados inválidos" },
      { status: 400 }
    );
  }

  try {
    const preview = await validateEmailVerificationForApproval(
      parsed.data.verificationId,
      parsed.data.code,
    );

    const queued = await maybeQueueApproval({
      session: session!,
      type: "USER_CREATE",
      payload: {
        verificationId: parsed.data.verificationId,
        code: parsed.data.code,
      },
      summary: `Cadastrar usuário: ${preview.name} (${preview.email}) — ${roleLabel(preview.role)}`,
    });
    if (queued) return queued;

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
