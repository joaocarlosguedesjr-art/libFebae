import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { lgpdRequestHandleSchema } from "@/lib/validations";
import { NextResponse } from "next/server";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  const session = await auth();

  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json();
  const parsed = lgpdRequestHandleSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Dados inválidos" },
      { status: 400 }
    );
  }

  const updated = await prisma.dataSubjectRequest.update({
    where: { id },
    data: {
      status: parsed.data.status,
      response: parsed.data.response,
      handledById: session.user.id,
    },
    include: {
      user: { select: { name: true, email: true } },
    },
  });

  return NextResponse.json(updated);
}
