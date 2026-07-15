import { createHash, randomInt } from "node:crypto";
import { hash } from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { decryptPayload, encryptPayload, maskEmail } from "@/lib/crypto-payload";
import { sendVerificationCodeEmail } from "@/lib/email";
import { recordAdminConsent, recordSelfConsent } from "@/lib/lgpd";
import type { Role } from "@/generated/prisma";

const CODE_TTL_MS = 10 * 60 * 1000;
const RESEND_COOLDOWN_MS = 60 * 1000;
const MAX_ATTEMPTS = 5;

export type SignupPayload = {
  name: string;
  passwordHash: string;
  cpf: string | null;
  role: Role;
  consentMethod: "ADMIN_REGISTRATION" | "SELF_ACCEPTANCE";
  adminId?: string;
};

function hashOtp(code: string, email: string): string {
  const secret = process.env.AUTH_SECRET ?? "dev-secret";
  return createHash("sha256").update(`${code}:${email}:${secret}`).digest("hex");
}

function generateCode(): string {
  return String(randomInt(0, 1_000_000)).padStart(6, "0");
}

function toPublicVerificationResult(
  verificationId: string,
  email: string,
  expiresAt: Date
) {
  return {
    verificationId,
    emailMasked: maskEmail(email),
    expiresAt,
  };
}

export async function requestEmailVerification(
  email: string,
  payload: Omit<SignupPayload, "passwordHash"> & { password: string },
  createdById?: string
) {
  const normalizedEmail = email.trim().toLowerCase();

  const existing = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });
  if (existing) {
    throw new Error("Este e-mail já está cadastrado");
  }

  const recent = await prisma.emailVerification.findFirst({
    where: {
      email: normalizedEmail,
      purpose: "USER_SIGNUP",
      verifiedAt: null,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: "desc" },
  });

  if (recent && Date.now() - recent.createdAt.getTime() < RESEND_COOLDOWN_MS) {
    const wait = Math.ceil(
      (RESEND_COOLDOWN_MS - (Date.now() - recent.createdAt.getTime())) / 1000
    );
    throw new Error(`Aguarde ${wait}s para reenviar o código`);
  }

  await prisma.emailVerification.deleteMany({
    where: {
      email: normalizedEmail,
      purpose: "USER_SIGNUP",
      verifiedAt: null,
    },
  });

  const code = generateCode();
  const passwordHash = await hash(payload.password, 10);

  const signupPayload: SignupPayload = {
    name: payload.name,
    passwordHash,
    cpf: payload.cpf,
    role: payload.role,
    consentMethod: payload.consentMethod,
    adminId: payload.adminId,
  };

  const verification = await prisma.emailVerification.create({
    data: {
      email: normalizedEmail,
      codeHash: hashOtp(code, normalizedEmail),
      purpose: "USER_SIGNUP",
      payload: encryptPayload(JSON.stringify(signupPayload)),
      expiresAt: new Date(Date.now() + CODE_TTL_MS),
      createdById: createdById ?? null,
    },
  });

  await sendVerificationCodeEmail(normalizedEmail, code, payload.name);

  return toPublicVerificationResult(
    verification.id,
    normalizedEmail,
    verification.expiresAt
  );
}

export async function resendEmailVerification(
  verificationId: string,
  options?: { adminId?: string }
) {
  const verification = await prisma.emailVerification.findUnique({
    where: { id: verificationId },
  });

  if (!verification || verification.verifiedAt) {
    throw new Error("Verificação inválida ou já concluída");
  }

  if (verification.expiresAt < new Date()) {
    throw new Error("Sessão expirada. Preencha o formulário novamente.");
  }

  if (
    options?.adminId &&
    verification.createdById &&
    verification.createdById !== options.adminId
  ) {
    throw new Error("Acesso negado");
  }

  if (Date.now() - verification.createdAt.getTime() < RESEND_COOLDOWN_MS) {
    const wait = Math.ceil(
      (RESEND_COOLDOWN_MS - (Date.now() - verification.createdAt.getTime())) / 1000
    );
    throw new Error(`Aguarde ${wait}s para reenviar o código`);
  }

  const signupPayload = JSON.parse(decryptPayload(verification.payload)) as SignupPayload;
  const code = generateCode();

  await prisma.emailVerification.update({
    where: { id: verificationId },
    data: {
      codeHash: hashOtp(code, verification.email),
      attempts: 0,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + CODE_TTL_MS),
    },
  });

  await sendVerificationCodeEmail(verification.email, code, signupPayload.name);

  return toPublicVerificationResult(
    verification.id,
    verification.email,
    new Date(Date.now() + CODE_TTL_MS)
  );
}

export async function validateEmailVerificationForApproval(verificationId: string, code: string) {
  const normalizedCode = code.replace(/\D/g, "");

  if (normalizedCode.length !== 6) {
    throw new Error("Informe o código de 6 dígitos");
  }

  const verification = await prisma.emailVerification.findUnique({
    where: { id: verificationId },
  });

  if (!verification) {
    throw new Error("Verificação inválida ou expirada");
  }

  if (verification.verifiedAt) {
    throw new Error("Este código já foi utilizado");
  }

  if (verification.expiresAt < new Date()) {
    throw new Error("Código expirado. Solicite um novo código.");
  }

  if (verification.attempts >= MAX_ATTEMPTS) {
    throw new Error("Número máximo de tentativas excedido. Solicite um novo código.");
  }

  const codeHash = hashOtp(normalizedCode, verification.email);
  const valid = codeHash === verification.codeHash;

  if (!valid) {
    await prisma.emailVerification.update({
      where: { id: verificationId },
      data: { attempts: { increment: 1 } },
    });
    throw new Error("Código incorreto");
  }

  const signupPayload = JSON.parse(decryptPayload(verification.payload)) as SignupPayload;

  return {
    email: verification.email,
    name: signupPayload.name,
    role: signupPayload.role,
  };
}

export async function confirmEmailVerification(verificationId: string, code: string) {
  const normalizedCode = code.replace(/\D/g, "");

  if (normalizedCode.length !== 6) {
    throw new Error("Informe o código de 6 dígitos");
  }

  const verification = await prisma.emailVerification.findUnique({
    where: { id: verificationId },
  });

  if (!verification) {
    throw new Error("Verificação inválida ou expirada");
  }

  const normalizedEmail = verification.email;

  if (verification.verifiedAt) {
    throw new Error("Este código já foi utilizado");
  }

  if (verification.expiresAt < new Date()) {
    throw new Error("Código expirado. Solicite um novo código.");
  }

  if (verification.attempts >= MAX_ATTEMPTS) {
    throw new Error("Número máximo de tentativas excedido. Solicite um novo código.");
  }

  const codeHash = hashOtp(normalizedCode, normalizedEmail);
  const valid = codeHash === verification.codeHash;

  if (!valid) {
    await prisma.emailVerification.update({
      where: { id: verificationId },
      data: { attempts: { increment: 1 } },
    });
    throw new Error("Código incorreto");
  }

  const signupPayload = JSON.parse(decryptPayload(verification.payload)) as SignupPayload;

  const existing = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });
  if (existing) {
    throw new Error("Este e-mail já está cadastrado");
  }

  const user = await prisma.user.create({
    data: {
      name: signupPayload.name,
      email: normalizedEmail,
      cpf: signupPayload.cpf,
      password: signupPayload.passwordHash,
      role: signupPayload.role,
    },
    select: {
      id: true,
      name: true,
      email: true,
      cpf: true,
      role: true,
      createdAt: true,
    },
  });

  if (signupPayload.consentMethod === "ADMIN_REGISTRATION" && signupPayload.adminId) {
    await recordAdminConsent(user.id, signupPayload.adminId);
  } else {
    await recordSelfConsent(user.id);
  }

  await prisma.emailVerification.update({
    where: { id: verificationId },
    data: { verifiedAt: new Date() },
  });

  return user;
}
