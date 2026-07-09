import { config } from "dotenv";
import { execSync } from "node:child_process";

config({ override: true });

const directUrl = process.env.DIRECT_URL?.trim();
const databaseUrl = process.env.DATABASE_URL?.trim();

if (directUrl) {
  process.env.DATABASE_URL = directUrl;
  console.log("[migrate] Usando DIRECT_URL (conexão direta ao Neon).");
} else if (databaseUrl?.includes("-pooler.")) {
  console.warn(
    "\n[migrate] AVISO: DATABASE_URL usa o pooler do Neon (-pooler).\n" +
      "Migrations podem falhar com timeout de advisory lock (P1002).\n" +
      "Defina DIRECT_URL no .env com a connection string direta (sem -pooler).\n" +
      "Neon Console → Connection details → Direct connection\n",
  );
}

execSync("npx prisma migrate deploy", { stdio: "inherit", env: process.env });
