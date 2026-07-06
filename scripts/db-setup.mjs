import { config } from "dotenv";
import { execSync } from "node:child_process";
import { existsSync, copyFileSync } from "node:fs";

config();

const DEFAULT_DATABASE_URL =
  "postgresql://biblioteca:biblioteca@localhost:5432/biblioteca";

if (!process.env.DATABASE_URL) {
  if (existsSync(".env.example") && !existsSync(".env")) {
    copyFileSync(".env.example", ".env");
    config();
  }
  process.env.DATABASE_URL ??= DEFAULT_DATABASE_URL;
}

const env = { ...process.env, SEED_DEMO: "true" };

function run(command) {
  execSync(command, { stdio: "inherit", env });
}

console.log(`DATABASE_URL=${env.DATABASE_URL}`);
console.log("SEED_DEMO=true (dados de demonstração)\n");

run("npx prisma generate");
run("npx prisma migrate deploy");
run("npx tsx prisma/seed.ts");

console.log("\nBanco criado com sucesso!");
console.log("Admin: admin@biblioteca.local / senha: admin123");
console.log("Leitor: maria@email.com / senha: leitor123");
