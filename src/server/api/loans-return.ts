import { auth } from "@/lib/auth";
import { returnLoan } from "@/lib/loans";
import { NextResponse } from "next/server";

type Params = { params: Promise<{ id: string }> };

export async function POST(_request: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }

  const { id } = await params;

  try {
    const loan = await returnLoan(id);
    return NextResponse.json(loan);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro ao devolver" },
      { status: 400 }
    );
  }
}
