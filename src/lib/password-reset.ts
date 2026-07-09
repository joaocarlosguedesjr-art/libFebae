import { createHash, randomInt } from "node:crypto";
import { hash } from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { decryptPayload, encryptPayload, maskEmail } from "@/lib/crypto-payload";
import { sendPasswordResetCodeEmail } from "@/lib/email";

const CODE_TTL_MS = 10 * 60 * 1000;
const RESEND_COOLDOWN_MS = 60 * 1000;
const RESET_WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 5;

type PasswordResetPayload = {
  userId: string;
  name: string;
};

function hashOtp(code: string, email: string): string {
  const secret = process.env.AUTH_SECRET ?? "dev-secret";
  return createHash("sha256").update(`${code}:${email}:${secret}`).digest("hex");
}

function generateCode(): string {
  return String(randomInt(0, 1_000_000)).padStart(6, "0");
}

function toPublicResult(verificationId: string, email: string, expiresAt: Date) {
  return {
    verificationId,
    emailMasked: maskEmail(email),
    expiresAt,
  };
}

const GENERIC_SEND_MESSAGE =
  "Se o e-mail estiver cadastrado, enviaremos um código de recuperação em instantes.";

export async function requestPasswordReset(email: string) {
  const normalizedEmail = email.trim().toLowerCase();

  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    select: { id: true, name: true },
  });

  if (!user) {
    return {
      message: GENERIC_SEND_MESSAGE,
      verificationId: null as string | null,
      emailMasked: maskEmail(normalizedEmail),
      expiresAt: null as Date | null,
    };
  }

  const recent = await prisma.emailVerification.findFirst({
    where: {
      email: normalizedEmail,
      purpose: "PASSWORD_RESET",
      verifiedAt: null,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: "desc" },
  });

  if (recent && Date.now() - recent.createdAt.getTime() < RESEND_COOLDOWN_MS) {
    const wait = Math.ceil(
      (RESEND_COOLDOWN_MS - (Date.now() - recent.createdAt.getTime())) / 1000,
    );
    throw new Error(`Aguarde ${wait}s para solicitar novamente`);
  }

  await prisma.emailVerification.deleteMany({
    where: {
      email: normalizedEmail,
      purpose: "PASSWORD_RESET",
      verifiedAt: null,
    },
  });

  const code = generateCode();
  const payload: PasswordResetPayload = { userId: user.id, name: user.name };

  const verification = await prisma.emailVerification.create({
    data: {
      email: normalizedEmail,
      codeHash: hashOtp(code, normalizedEmail),
      purpose: "PASSWORD_RESET",
      payload: encryptPayload(JSON.stringify(payload)),
      expiresAt: new Date(Date.now() + CODE_TTL_MS),
    },
  });

  await sendPasswordResetCodeEmail(normalizedEmail, code, user.name);

  return {
    message: GENERIC_SEND_MESSAGE,
    ...toPublicResult(verification.id, normalizedEmail, verification.expiresAt),
  };
}

export async function resendPasswordReset(verificationId: string) {
  const verification = await prisma.emailVerification.findUnique({
    where: { id: verificationId },
  });

  if (
    !verification ||
    verification.purpose !== "PASSWORD_RESET" ||
    verification.verifiedAt
  ) {
    throw new Error("Sessão inválida ou já concluída");
  }

  if (verification.expiresAt < new Date()) {
    throw new Error("Sessão expirada. Solicite um novo código.");
  }

  if (Date.now() - verification.createdAt.getTime() < RESEND_COOLDOWN_MS) {
    const wait = Math.ceil(
      (RESEND_COOLDOWN_MS - (Date.now() - verification.createdAt.getTime())) / 1000,
    );
    throw new Error(`Aguarde ${wait}s para reenviar o código`);
  }

  const payload = JSON.parse(decryptPayload(verification.payload)) as PasswordResetPayload;
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

  await sendPasswordResetCodeEmail(verification.email, code, payload.name);

  return toPublicResult(verification.id, verification.email, new Date(Date.now() + CODE_TTL_MS));
}

export async function verifyPasswordResetCode(verificationId: string, code: string) {
  const normalizedCode = code.replace(/\D/g, "");
  if (normalizedCode.length !== 6) {
    throw new Error("Informe o código de 6 dígitos");
  }

  const verification = await prisma.emailVerification.findUnique({
    where: { id: verificationId },
  });

  if (!verification || verification.purpose !== "PASSWORD_RESET") {
    throw new Error("Sessão inválida ou expirada");
  }

  if (verification.verifiedAt) {
    return { verified: true, emailMasked: maskEmail(verification.email) };
  }

  if (verification.expiresAt < new Date()) {
    throw new Error("Código expirado. Solicite um novo código.");
  }

  if (verification.attempts >= MAX_ATTEMPTS) {
    throw new Error("Número máximo de tentativas excedido. Solicite um novo código.");
  }

  const valid = hashOtp(normalizedCode, verification.email) === verification.codeHash;

  if (!valid) {
    await prisma.emailVerification.update({
      where: { id: verificationId },
      data: { attempts: { increment: 1 } },
    });
    throw new Error("Código incorreto");
  }

  await prisma.emailVerification.update({
    where: { id: verificationId },
    data: { verifiedAt: new Date() },
  });

  return { verified: true, emailMasked: maskEmail(verification.email) };
}

export async function completePasswordReset(
  verificationId: string,
  password: string,
) {
  const verification = await prisma.emailVerification.findUnique({
    where: { id: verificationId },
  });

  if (
    !verification ||
    verification.purpose !== "PASSWORD_RESET" ||
    !verification.verifiedAt
  ) {
    throw new Error("Sessão inválida. Confirme o código novamente.");
  }

  const verifiedAt = verification.verifiedAt.getTime();
  if (Date.now() - verifiedAt > RESET_WINDOW_MS) {
    throw new Error("Tempo para redefinir a senha expirou. Solicite um novo código.");
  }

  const payload = JSON.parse(decryptPayload(verification.payload)) as PasswordResetPayload;
  const passwordHash = await hash(password, 10);

  await prisma.$transaction([
    prisma.user.update({
      where: { id: payload.userId },
      data: { password: passwordHash },
    }),
    prisma.emailVerification.delete({ where: { id: verificationId } }),
  ]);

  return { success: true };
}
