import { config } from "dotenv";
import { execSync } from "node:child_process";

config({ override: true });

function deriveDirectUrlFromPooler(url) {
  try {
    const parsed = new URL(url);
    if (!parsed.hostname.includes("-pooler.")) return null;
    parsed.hostname = parsed.hostname.replace("-pooler.", ".");
    return parsed.toString();
  } catch {
    return null;
  }
}

const directUrl = process.env.DIRECT_URL?.trim();
const databaseUrl = process.env.DATABASE_URL?.trim();

if (directUrl) {
  process.env.DATABASE_URL = directUrl;
  console.log("[migrate] Usando DIRECT_URL (conexão direta ao Neon).");
} else {
  const derived = databaseUrl ? deriveDirectUrlFromPooler(databaseUrl) : null;
  if (derived) {
    process.env.DATABASE_URL = derived;
    console.log("[migrate] Usando conexão direta derivada do DATABASE_URL (sem pooler).");
  } else if (databaseUrl?.includes("-pooler.")) {
    console.warn(
      "\n[migrate] AVISO: não foi possível derivar URL direta do pooler.\n" +
        "Defina DIRECT_URL no .env com a connection string direta (sem -pooler).\n",
    );
  }
}

execSync("npx prisma migrate deploy", { stdio: "inherit", env: process.env });
