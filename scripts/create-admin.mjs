import { config } from "dotenv";
import { PrismaClient } from "../src/generated/prisma/index.js";
import { hash } from "bcryptjs";

config();

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--email" || arg === "--name" || arg === "--password") {
      args[arg.slice(2)] = argv[i + 1];
      i++;
    }
  }
  return args;
}

const { email, name, password } = parseArgs(process.argv.slice(2));

if (!email || !name || !password) {
  console.error(
    "Uso: npm run admin:create -- --email admin@centro.org.br --name \"Bibliotecário\" --password \"senha-forte\""
  );
  process.exit(1);
}

if (password.length < 8) {
  console.error("A senha deve ter no mínimo 8 caracteres.");
  process.exit(1);
}

const prisma = new PrismaClient();

try {
  const hashed = await hash(password, 10);

  const user = await prisma.user.upsert({
    where: { email },
    update: { name, password: hashed, role: "ADMIN" },
    create: {
      name,
      email,
      password: hashed,
      role: "ADMIN",
    },
  });

  await prisma.appConfig.upsert({
    where: { id: "default" },
    update: {},
    create: { id: "default", loanDaysDefault: 14 },
  });

  console.log(`Administrador configurado: ${user.email}`);
} catch (error) {
  console.error("Erro ao criar administrador:", error);
  process.exit(1);
} finally {
  await prisma.$disconnect();
}
