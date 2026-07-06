import { createHash } from "node:crypto";
import { prisma } from "../src/lib/prisma";
import {
  confirmEmailVerification,
  requestEmailVerification,
} from "../src/lib/email-verification";

const TEST_EMAIL = process.argv[2] ?? "joao.carlos.guedes.jr@gmail.com";
const TEST_NAME = "João Carlos (teste)";
const TEST_PASSWORD = "TesteFlow123!";

function hashOtp(code: string, email: string): string {
  const secret = process.env.AUTH_SECRET ?? "dev-secret";
  return createHash("sha256").update(`${code}:${email}:${secret}`).digest("hex");
}

async function resolveOtpFromDb(verificationId: string, email: string): Promise<string> {
  const verification = await prisma.emailVerification.findUnique({
    where: { id: verificationId },
  });
  if (!verification) throw new Error("Verificação não encontrada no banco");

  for (let n = 0; n < 1_000_000; n++) {
    const code = String(n).padStart(6, "0");
    if (hashOtp(code, email) === verification.codeHash) return code;
  }
  throw new Error("Não foi possível resolver o OTP (hash não encontrado)");
}

async function cleanup() {
  await prisma.emailVerification.deleteMany({ where: { email: TEST_EMAIL } });
  await prisma.user.deleteMany({ where: { email: TEST_EMAIL } });
}

async function main() {
  console.log("=== Teste do fluxo completo de cadastro ===\n");
  console.log(`E-mail: ${TEST_EMAIL}\n`);

  await cleanup();

  console.log("1/3 Enviando código (requestEmailVerification)...");
  const sendResult = await requestEmailVerification(TEST_EMAIL, {
    name: TEST_NAME,
    password: TEST_PASSWORD,
    cpf: null,
    role: "READER",
    consentMethod: "SELF_ACCEPTANCE",
  });
  console.log(`   OK — verificationId: ${sendResult.verificationId}`);
  console.log(`   E-mail mascarado: ${sendResult.emailMasked}`);
  console.log("   Verifique a caixa de entrada (e spam).\n");

  console.log("2/3 Resolvendo OTP para confirmar (teste automatizado)...");
  const code = await resolveOtpFromDb(sendResult.verificationId, TEST_EMAIL);
  console.log(`   OTP resolvido para prosseguir com a confirmação.\n`);

  console.log("3/3 Confirmando cadastro (confirmEmailVerification)...");
  const user = await confirmEmailVerification(sendResult.verificationId, code);
  console.log(`   OK — usuário criado: ${user.name} (${user.role})\n`);

  console.log("=== Fluxo completo concluído com sucesso ===");

  await cleanup();
  console.log("Dados de teste removidos do banco.");
}

main().catch(async (err) => {
  console.error("\nFalha no fluxo:", err instanceof Error ? err.message : err);
  await cleanup().catch(() => {});
  process.exit(1);
});
