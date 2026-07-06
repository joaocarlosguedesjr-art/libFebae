import { execSync } from "node:child_process";

function run(command) {
  execSync(command, { stdio: "inherit", env: process.env });
}

const isVercel = process.env.VERCEL === "1";
const databaseUrl = process.env.DATABASE_URL?.trim();

run("npx prisma generate");

if (isVercel) {
  if (!databaseUrl) {
    console.error(
      "\n[build] DATABASE_URL não configurada na Vercel (Production).\n" +
        "Project Settings → Environment Variables → DATABASE_URL\n"
    );
    process.exit(1);
  }

  if (databaseUrl.includes("localhost")) {
    console.error(
      "\n[build] DATABASE_URL aponta para localhost na Vercel.\n" +
        "Configure a connection string do Neon em Production.\n"
    );
    process.exit(1);
  }

  console.log("[build] Migrations já aplicadas no Neon; pulando migrate deploy no build.");
} else if (databaseUrl && !databaseUrl.includes("localhost")) {
  run("npx prisma migrate deploy");
}

run("npx next build");
