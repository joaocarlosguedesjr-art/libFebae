import { config } from "dotenv";
import { spawnSync } from "node:child_process";

config();

const databaseUrl = process.env.DATABASE_URL?.trim();
if (!databaseUrl) {
  console.error("DATABASE_URL não encontrada no .env local.");
  process.exit(1);
}

if (databaseUrl.includes("localhost")) {
  console.error("DATABASE_URL local aponta para localhost; use a URL do Neon.");
  process.exit(1);
}

for (const target of ["production", "preview", "development"]) {
  const result = spawnSync(
    "npx",
    ["vercel", "env", "add", "DATABASE_URL", target, "--force"],
    {
      input: databaseUrl,
      encoding: "utf8",
      stdio: ["pipe", "inherit", "inherit"],
      shell: true,
    }
  );
  if (result.status !== 0) process.exit(1);
  console.log(`[ok] DATABASE_URL → ${target}`);
}

console.log("\nDATABASE_URL do Neon sincronizada com a Vercel.");
