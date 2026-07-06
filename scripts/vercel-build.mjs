import { execSync } from "node:child_process";

function run(command) {
  execSync(command, { stdio: "inherit", env: process.env });
}

run("npx prisma generate");

if (!process.env.DATABASE_URL) {
  console.error(
    "\n[build] DATABASE_URL não configurada na Vercel.\n" +
      "Adicione em Project Settings → Environment Variables (Production, Preview, Development).\n"
  );
  process.exit(1);
}

run("npx prisma migrate deploy");
run("npx next build");
