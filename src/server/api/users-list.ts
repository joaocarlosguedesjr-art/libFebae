import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { denyUnlessStaff } from "@/lib/staff-access";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const session = await auth();
  const denied = denyUnlessStaff(session);
  if (denied) return denied;

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim() ?? "";

  const users = await prisma.user.findMany({
    where: q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { email: { contains: q, mode: "insensitive" } },
            { cpf: { contains: q, mode: "insensitive" } },
          ],
        }
      : undefined,
    select: {
      id: true,
      name: true,
      email: true,
      cpf: true,
      role: true,
      createdAt: true,
      _count: { select: { loans: true } },
    },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(users);
}

export async function POST() {
  return NextResponse.json(
    {
      error:
        "Use o fluxo de verificação por e-mail: envie o código e confirme em /api/users/verify-email",
    },
    { status: 410 }
  );
}
