import { sendVerificationCodeEmail } from "../src/lib/email";

const TO = process.argv[2] ?? "joao.carlos.guedes.jr@gmail.com";
const MOCK_CODE = "847291";
const MOCK_NAME = "João Carlos";

async function main() {
  console.log(`Enviando e-mail de teste para: ${TO}`);
  console.log(`SMTP_HOST: ${process.env.SMTP_HOST ?? "(não definido)"}`);
  console.log(`SMTP_USER: ${process.env.SMTP_USER ? "***configurado***" : "(não definido)"}`);

  await sendVerificationCodeEmail(TO, MOCK_CODE, MOCK_NAME);

  console.log("E-mail enviado com sucesso.");
}

main().catch((err) => {
  console.error("Falha no envio:", err instanceof Error ? err.message : err);
  process.exit(1);
});
