import { verifyLoanActionToken } from "@/lib/loan-action-token";
import { renewLoan, requestReturnLoan } from "@/lib/loans";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const token = searchParams.get("token")?.trim();

  if (!token) {
    return NextResponse.redirect(`${origin}/login?acao=token-invalido`);
  }

  try {
    const payload = verifyLoanActionToken(token);
    const loan = await prisma.loan.findUnique({
      where: { id: payload.loanId },
      select: { userId: true },
    });

    if (!loan || loan.userId !== payload.userId) {
      return NextResponse.redirect(`${origin}/login?acao=loan-invalido`);
    }

    if (payload.action === "renew") {
      await renewLoan(payload.loanId);
      return NextResponse.redirect(`${origin}/login?acao=renovado`);
    }

    if (payload.action === "request-return") {
      await requestReturnLoan(payload.loanId);
      return NextResponse.redirect(`${origin}/login?acao=devolucao-solicitada`);
    }

    return NextResponse.redirect(`${origin}/login?acao=token-invalido`);
  } catch {
    return NextResponse.redirect(`${origin}/login?acao=token-expirado`);
  }
}
