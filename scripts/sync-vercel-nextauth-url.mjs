import { spawnSync } from "node:child_process";

const PRODUCTION_APP_URL = "https://www.bibliotecafeabe.com.br";

for (const target of ["production", "preview", "development"]) {
  const result = spawnSync(
    "npx",
    ["vercel", "env", "add", "NEXTAUTH_URL", target, "--force"],
    {
      input: PRODUCTION_APP_URL,
      encoding: "utf8",
      stdio: ["pipe", "inherit", "inherit"],
      shell: true,
    }
  );
  if (result.status !== 0) process.exit(1);
  console.log(`[ok] NEXTAUTH_URL → ${target}`);
}

console.log(`\nNEXTAUTH_URL = ${PRODUCTION_APP_URL}`);
