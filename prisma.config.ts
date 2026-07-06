import { config } from "dotenv";
import { defineConfig, env } from "prisma/config";

if (!process.env.VERCEL && !process.env.CI) {
  config({ override: true });

  if (!process.env.DATABASE_URL) {
    process.env.DATABASE_URL =
      "postgresql://biblioteca:biblioteca@localhost:5432/biblioteca";
  }
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  engine: "classic",
  datasource: {
    url: env("DATABASE_URL"),
  },
});
