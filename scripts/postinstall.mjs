import { execSync } from "node:child_process";
import { existsSync } from "node:fs";

// Evita falha do npm install quando o engine do Prisma está bloqueado
// (OneDrive, antivírus ou servidor dev rodando).
function runPrismaGenerate() {
  try {
    execSync("npx prisma generate", { stdio: "inherit" });
    return true;
  } catch {
    return false;
  }
}

if (!existsSync("prisma/schema.prisma")) {
  process.exit(0);
}

const ok = runPrismaGenerate();

if (!ok) {
  console.warn(
    "\n[postinstall] prisma generate falhou (arquivo em uso ou pasta sincronizada)."
  );
  console.warn("Pare o servidor (npm run dev) e execute: npm run db:generate\n");
}
