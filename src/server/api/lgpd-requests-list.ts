import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { dataSubjectRequestSchema } from "@/lib/validations";
import { isStaff } from "@/lib/roles";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const where = isStaff(session.user.role) ? {} : { userId: session.user.id };

  const requests = await prisma.dataSubjectRequest.findMany({
    where,
    include: {
      user: { select: { id: true, name: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(requests);
}

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = dataSubjectRequestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Dados inválidos" },
      { status: 400 }
    );
  }

  const created = await prisma.dataSubjectRequest.create({
    data: {
      userId: session.user.id,
      type: parsed.data.type,
      description: parsed.data.description,
    },
  });

  return NextResponse.json(created, { status: 201 });
}
