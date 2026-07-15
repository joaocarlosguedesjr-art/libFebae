import { auth } from "@/lib/auth";
import { APPROVAL_TYPE_LABELS } from "@/lib/approvals";
import { prisma } from "@/lib/prisma";
import { denyUnlessAdmin } from "@/lib/staff-access";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const session = await auth();
  const denied = denyUnlessAdmin(session);
  if (denied) return denied;

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") ?? "PENDING";
  const type = searchParams.get("type");

  const items = await prisma.approvalRequest.findMany({
    where: {
      status: status as "PENDING" | "APPROVED" | "REJECTED",
      ...(type ? { type: type as never } : {}),
    },
    include: {
      requestedBy: { select: { id: true, name: true, email: true, role: true } },
      reviewedBy: { select: { id: true, name: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return NextResponse.json(
    items.map((item) => ({
      ...item,
      typeLabel: APPROVAL_TYPE_LABELS[item.type],
      payload: undefined,
    })),
  );
}
