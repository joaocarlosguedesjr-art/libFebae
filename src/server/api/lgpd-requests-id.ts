import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { lgpdRequestHandleSchema } from "@/lib/validations";
import { denyUnlessStaff, maybeQueueApproval } from "@/lib/staff-access";
import { NextResponse } from "next/server";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  const session = await auth();
  const denied = denyUnlessStaff(session);
  if (denied) return denied;

  const { id } = await params;
  const body = await request.json();
  const parsed = lgpdRequestHandleSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Dados inválidos" },
      { status: 400 }
    );
  }

  const existing = await prisma.dataSubjectRequest.findUnique({
    where: { id },
    include: { user: { select: { name: true, email: true } } },
  });

  if (!existing) {
    return NextResponse.json({ error: "Solicitação não encontrada" }, { status: 404 });
  }

  const queued = await maybeQueueApproval({
    session: session!,
    type: "LGPD_REQUEST_UPDATE",
    payload: {
      requestId: id,
      status: parsed.data.status,
      response: parsed.data.response,
    },
    summary: `Tratar solicitação LGPD (${parsed.data.status}): ${existing.user.name}`,
    entityId: id,
  });
  if (queued) return queued;

  const updated = await prisma.dataSubjectRequest.update({
    where: { id },
    data: {
      status: parsed.data.status,
      response: parsed.data.response,
      handledById: session!.user.id,
    },
    include: {
      user: { select: { name: true, email: true } },
    },
  });

  return NextResponse.json(updated);
}
