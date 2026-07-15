import { auth } from "@/lib/auth";
import {
  approveAndExecute,
  getApprovalDetail,
  rejectApproval,
} from "@/lib/approvals";
import { approvalReviewSchema } from "@/lib/validations";
import { denyUnlessAdmin } from "@/lib/staff-access";
import { NextResponse } from "next/server";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const session = await auth();
  const denied = denyUnlessAdmin(session);
  if (denied) return denied;

  const { id } = await params;
  const detail = await getApprovalDetail(id);

  if (!detail) {
    return NextResponse.json({ error: "Solicitação não encontrada" }, { status: 404 });
  }

  return NextResponse.json(detail);
}

export async function PATCH(request: Request, { params }: Params) {
  const session = await auth();
  const denied = denyUnlessAdmin(session);
  if (denied) return denied;

  const { id } = await params;
  const body = await request.json();
  const parsed = approvalReviewSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Dados inválidos" },
      { status: 400 },
    );
  }

  try {
    if (parsed.data.action === "approve") {
      const result = await approveAndExecute(id, session!.user.id, parsed.data.adminNote);
      return NextResponse.json(result);
    }

    const result = await rejectApproval(id, session!.user.id, parsed.data.adminNote);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro ao processar aprovação" },
      { status: 400 },
    );
  }
}
