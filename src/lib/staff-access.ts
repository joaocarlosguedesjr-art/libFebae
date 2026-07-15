import type { Session } from "next-auth";
import { NextResponse } from "next/server";
import type { ApprovalType } from "@/generated/prisma";
import { createApprovalRequest, librarianNeedsApproval } from "@/lib/approvals";
import { isStaff } from "@/lib/roles";

export function denyUnlessStaff(session: Session | null) {
  if (!session?.user || !isStaff(session.user.role)) {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }
  return null;
}

export function denyUnlessAdmin(session: Session | null) {
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }
  return null;
}

export async function maybeQueueApproval(options: {
  session: Session;
  type: ApprovalType;
  payload: unknown;
  summary: string;
  entityId?: string;
}) {
  const needsApproval = await librarianNeedsApproval(options.session.user.role);
  if (!needsApproval) return null;

  const approval = await createApprovalRequest({
    type: options.type,
    payload: options.payload,
    summary: options.summary,
    entityId: options.entityId,
    requestedById: options.session.user.id,
  });

  return NextResponse.json(
    {
      pendingApproval: true,
      approvalId: approval.id,
      message: "Solicitação enviada para aprovação do administrador.",
    },
    { status: 202 },
  );
}
