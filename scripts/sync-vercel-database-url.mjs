import { config } from "dotenv";
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";

// .env.local da Vercel CLI não deve sobrescrever o Neon em .env
config({ path: ".env", override: true });

let databaseUrl = process.env.DATABASE_URL?.trim();
if ((!databaseUrl || databaseUrl.includes("localhost")) && existsSync(".env")) {
  const match = readFileSync(".env", "utf8").match(
    /^DATABASE_URL=(?:\"([^\"]+)\"|'([^']+)'|(\S+))/m
  );
  databaseUrl = match?.[1] ?? match?.[2] ?? match?.[3] ?? "";
}
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
