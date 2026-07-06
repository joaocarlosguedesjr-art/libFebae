import { execSync, spawn } from "node:child_process";
import { existsSync, rmSync } from "node:fs";
import { config } from "dotenv";

config({ override: true });

function removeNextCache() {
  if (!existsSync(".next")) return;

  console.log("Removendo cache .next...");
  if (process.platform === "win32") {
    execSync(
      'powershell -NoProfile -Command "if (Test-Path .next) { Remove-Item -Recurse -Force .next }"',
      { stdio: "inherit" }
    );
    return;
  }

  rmSync(".next", { recursive: true, force: true });
}

console.log("Encerrando servidor de desenvolvimento...");
try {
  execSync("node scripts/dev-stop.mjs", { stdio: "inherit" });
} catch {
  // servidor já estava parado
}

removeNextCache();

console.log("Iniciando com cache limpo...");
const child = spawn("node", ["scripts/dev.mjs"], {
  stdio: "inherit",
  env: process.env,
  shell: true,
});

child.on("exit", (code) => process.exit(code ?? 0));
