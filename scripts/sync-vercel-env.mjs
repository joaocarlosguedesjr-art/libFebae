import { config } from "dotenv";
import { spawnSync } from "node:child_process";

config();

/** Manter alinhado com src/lib/app-url.ts */
const PRODUCTION_APP_URL = "https://www.bibliotecafeabe.com.br";

const entries = {
  DATABASE_URL: process.env.DATABASE_URL,
  AUTH_SECRET: process.env.AUTH_SECRET,
  NEXTAUTH_URL: process.env.VERCEL_PRODUCTION_URL ?? PRODUCTION_APP_URL,
  SEED_DEMO: "false",
  SMTP_HOST: process.env.SMTP_HOST,
  SMTP_PORT: process.env.SMTP_PORT,
  SMTP_SECURE: process.env.SMTP_SECURE,
  SMTP_USER: process.env.SMTP_USER,
  SMTP_PASS: process.env.SMTP_PASS,
  SMTP_FROM: process.env.SMTP_FROM,
  SMTP_FROM_NAME: process.env.SMTP_FROM_NAME,
};

function addEnv(name, value) {
  if (!value) {
    console.warn(`[skip] ${name} (vazio)`);
    return;
  }

  for (const target of ["production", "preview", "development"]) {
    const result = spawnSync(
      "npx",
      ["vercel", "env", "add", name, target, "--force"],
      { input: value, encoding: "utf8", stdio: ["pipe", "inherit", "inherit"], shell: true }
    );

    if (result.status !== 0) {
      throw new Error(`Falha ao adicionar ${name} (${target})`);
    }

    console.log(`[ok] ${name} → ${target}`);
  }
}

for (const [name, value] of Object.entries(entries)) {
  addEnv(name, value);
}

console.log("\nVariáveis sincronizadas com a Vercel.");
