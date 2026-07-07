import { auth } from "@/lib/auth";
import { recordSelfConsent } from "@/lib/lgpd";
import { NextResponse } from "next/server";

export async function POST() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  await recordSelfConsent(session.user.id);

  return NextResponse.json({ success: true });
}
