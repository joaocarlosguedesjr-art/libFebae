import { existsSync, readFileSync, unlinkSync } from "node:fs";
import { execSync } from "node:child_process";
import { join } from "node:path";

const lockPath = join(".next", "dev", "lock");

if (!existsSync(lockPath)) {
  console.log("Nenhum servidor de desenvolvimento em execução.");
  process.exit(0);
}

try {
  const info = JSON.parse(readFileSync(lockPath, "utf8"));
  if (info?.pid) {
    console.log(`Encerrando servidor (PID ${info.pid})...`);
    if (process.platform === "win32") {
      execSync(`taskkill /PID ${info.pid} /F`, { stdio: "inherit" });
    } else {
      process.kill(info.pid, "SIGTERM");
    }
  }
} catch (error) {
  console.error("Não foi possível ler o lock do servidor:", error.message);
}

try {
  unlinkSync(lockPath);
} catch {
  // ignore
}

console.log("Servidor encerrado.");
