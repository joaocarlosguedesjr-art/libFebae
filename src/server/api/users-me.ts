import { auth } from "@/lib/auth";
import { formatCpf, getLegalConfig, hasValidConsent, maskCpf } from "@/lib/lgpd";
import { prisma } from "@/lib/prisma";
import { profileUpdateSchema } from "@/lib/validations";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const [user, config] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        cpf: true,
        role: true,
        createdAt: true,
        privacyAcceptedAt: true,
        privacyPolicyVersion: true,
        termsAcceptedAt: true,
        termsVersion: true,
        consentMethod: true,
        loans: {
          select: {
            id: true,
            loanDate: true,
            dueDate: true,
            returnDate: true,
            status: true,
            copy: {
              select: {
                code: true,
                book: { select: { title: true, author: true } },
              },
            },
          },
          orderBy: { loanDate: "desc" },
          take: 20,
        },
        dataSubjectRequests: {
          orderBy: { createdAt: "desc" },
          take: 10,
        },
      },
    }),
    getLegalConfig(),
  ]);

  if (!user) {
    return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });
  }

  return NextResponse.json({
    ...user,
    cpfMasked: maskCpf(user.cpf),
    cpfFormatted: user.cpf ? formatCpf(user.cpf) : null,
    cpf: session.user.role === "ADMIN" ? user.cpf : undefined,
    consentValid: hasValidConsent(user, config),
    legalConfig: {
      privacyPolicyVersion: config.privacyPolicyVersion,
      termsVersion: config.termsVersion,
      dpoEmail: config.dpoEmail,
    },
  });
}

export async function PATCH(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = profileUpdateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Dados inválidos" },
      { status: 400 }
    );
  }

  const { name, email, cpf } = parsed.data;

  const user = await prisma.user.update({
    where: { id: session.user.id },
    data: {
      name,
      email,
      cpf: cpf || null,
    },
    select: {
      id: true,
      name: true,
      email: true,
      cpf: true,
    },
  });

  return NextResponse.json(user);
}
