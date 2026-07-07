import { spawnSync } from "node:child_process";

function run(args) {
  const result = spawnSync("npx", ["vercel", "domains", "verify", ...args], {
    encoding: "utf8",
    shell: true,
  });
  process.stdout.write(result.stdout ?? "");
  process.stderr.write(result.stderr ?? "");
  return result.status === 0;
}

console.log("Verificando DNS do domínio FEABE...\n");

const root = run(["bibliotecafeabe.com.br"]);
console.log("");
const www = run(["www.bibliotecafeabe.com.br"]);

if (root && www) {
  console.log("\n✓ DNS configurado. Acesse https://www.bibliotecafeabe.com.br");
  process.exit(0);
}

console.log("\n✗ DNS ainda pendente. Veja doc/dns-go-live.md");
process.exit(1);
