import { config } from "dotenv";
import { execSync } from "node:child_process";
import { copyFileSync, existsSync } from "node:fs";

// override: true — garante que o .env do projeto prevaleça sobre variáveis do sistema
config({ override: true });

if (!process.env.DATABASE_URL) {
  if (!existsSync(".env") && existsSync(".env.example")) {
    copyFileSync(".env.example", ".env");
    config({ override: true });
  }
  process.env.DATABASE_URL =
    "postgresql://biblioteca:biblioteca@localhost:5432/biblioteca";
}

const command = process.argv.slice(2).join(" ");

if (!command) {
  console.error("Uso: node scripts/with-env.mjs <comando>");
  process.exit(1);
}

execSync(command, { stdio: "inherit", env: process.env });
