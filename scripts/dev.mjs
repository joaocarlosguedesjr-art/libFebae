import { config } from "dotenv";
import { execSync, spawn } from "node:child_process";
import { copyFileSync, existsSync, readFileSync, unlinkSync } from "node:fs";
import { join } from "node:path";

config({ override: true });

if (!process.env.DATABASE_URL) {
  if (!existsSync(".env") && existsSync(".env.example")) {
    copyFileSync(".env.example", ".env");
    config({ override: true });
  }
  process.env.DATABASE_URL =
    "postgresql://biblioteca:biblioteca@localhost:5432/biblioteca";
}

const lockPath = join(".next", "dev", "lock");

function isProcessRunning(pid) {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

function stopProcess(pid) {
  try {
    if (process.platform === "win32") {
      execSync(`taskkill /PID ${pid} /F`, { stdio: "ignore" });
    } else {
      process.kill(pid, "SIGTERM");
    }
    return true;
  } catch {
    return false;
  }
}

function cleanupStaleDevServer() {
  if (!existsSync(lockPath)) return;

  try {
    const info = JSON.parse(readFileSync(lockPath, "utf8"));
    if (info?.pid && isProcessRunning(info.pid)) {
      console.log(`Encerrando servidor anterior (PID ${info.pid}, porta ${info.port ?? "?"})...`);
      stopProcess(info.pid);
    }
  } catch {
    // lock corrompido ou vazio
  }

  try {
    unlinkSync(lockPath);
  } catch {
    // outro processo pode ainda estar liberando o arquivo
  }
}

cleanupStaleDevServer();

console.log("Gerando Prisma Client...");
execSync("npx prisma generate", { stdio: "inherit", env: process.env });

console.log("Iniciando Next.js com Webpack...");

// Turbopack quebra com paths com espaço/OneDrive no Windows — usar Webpack sempre no dev
const devArgs = ["next", "dev", "--webpack"];

const child = spawn("npx", devArgs, {
  stdio: "inherit",
  env: process.env,
  shell: true,
});

child.on("exit", (code) => process.exit(code ?? 0));

process.on("SIGINT", () => child.kill("SIGINT"));
process.on("SIGTERM", () => child.kill("SIGTERM"));
