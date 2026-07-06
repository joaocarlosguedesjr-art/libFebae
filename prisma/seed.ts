import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma";
import { INSTITUTION_DEFAULTS } from "../src/lib/institution";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  await prisma.appConfig.upsert({
    where: { id: "default" },
    update: {
      institutionName: INSTITUTION_DEFAULTS.institutionName,
      institutionAddress: INSTITUTION_DEFAULTS.institutionAddress,
      institutionEmail: INSTITUTION_DEFAULTS.institutionEmail,
      dpoEmail: INSTITUTION_DEFAULTS.dpoEmail,
    },
    create: {
      id: "default",
      loanDaysDefault: INSTITUTION_DEFAULTS.loanDaysDefault,
      privacyPolicyVersion: INSTITUTION_DEFAULTS.privacyPolicyVersion,
      termsVersion: INSTITUTION_DEFAULTS.termsVersion,
      institutionName: INSTITUTION_DEFAULTS.institutionName,
      institutionAddress: INSTITUTION_DEFAULTS.institutionAddress,
      institutionEmail: INSTITUTION_DEFAULTS.institutionEmail,
      dpoEmail: INSTITUTION_DEFAULTS.dpoEmail,
    },
  });

  if (process.env.SEED_DEMO !== "true") {
    console.log("Configuração institucional aplicada (FEABE).");
    console.log("Seed de demonstração ignorado (SEED_DEMO≠true).");
    return;
  }

  const adminPassword = await hash("admin123", 10);
  const readerPassword = await hash("leitor123", 10);

  const consentData = {
    privacyAcceptedAt: new Date(),
    privacyPolicyVersion: "1.0",
    termsAcceptedAt: new Date(),
    termsVersion: "1.0",
    consentMethod: "ADMIN_REGISTRATION" as const,
  };

  const admin = await prisma.user.upsert({
    where: { email: "admin@biblioteca.local" },
    update: consentData,
    create: {
      name: "Bibliotecário",
      email: "admin@biblioteca.local",
      password: adminPassword,
      role: "ADMIN",
      cpf: "00000000001",
      ...consentData,
    },
  });

  const reader = await prisma.user.upsert({
    where: { email: "maria@email.com" },
    update: consentData,
    create: {
      name: "Maria Silva",
      email: "maria@email.com",
      password: readerPassword,
      role: "READER",
      cpf: "12345678901",
      ...consentData,
      consentRecordedById: admin.id,
    },
  });

  const codificacao = await prisma.category.upsert({
    where: { name: "Codificação Kardecista" },
    update: {},
    create: { name: "Codificação Kardecista" },
  });

  const romance = await prisma.category.upsert({
    where: { name: "Romance Espírita" },
    update: {},
    create: { name: "Romance Espírita" },
  });

  const book1 = await prisma.book.upsert({
    where: { isbn: "9788573281234" },
    update: {},
    create: {
      title: "O Livro dos Espíritos",
      subtitle: "Princípios da Doutrina Espírita",
      author: "Allan Kardec",
      workType: "CODIFICATION",
      isbn: "9788573281234",
      publisher: "FEB",
      year: 1857,
      language: "Português",
      synopsis:
        "Obra fundamental da codificação espírita. Reúne perguntas e respostas sobre a natureza dos Espíritos, a vida após a morte, a lei de causa e efeito e os fundamentos da Doutrina Espírita.",
      categories: { connect: [{ id: codificacao.id }] },
    },
  });

  const book2 = await prisma.book.upsert({
    where: { isbn: "9788573285676" },
    update: {},
    create: {
      title: "Nosso Lar",
      author: "André Luiz",
      medium: "Francisco Cândido Xavier",
      workType: "PSYCHOGRAPHED",
      collection: "Série André Luiz",
      isbn: "9788573285676",
      publisher: "FEB",
      year: 1944,
      language: "Português",
      synopsis:
        "Primeiro romance da série psicografada por André Luiz. Narra a transição do autor para a vida espiritual e sua adaptação em uma colônia espírita chamada Nosso Lar, com ensinamentos sobre caridade e trabalho no plano espiritual.",
      categories: { connect: [{ id: romance.id }] },
    },
  });

  const book3 = await prisma.book.upsert({
    where: { isbn: "9788573289012" },
    update: {},
    create: {
      title: "O Evangelho Segundo o Espiritismo",
      author: "Allan Kardec",
      workType: "CODIFICATION",
      isbn: "9788573289012",
      publisher: "FEB",
      year: 1864,
      language: "Português",
      synopsis:
        "Comentários às máximas morais do Cristo em consonância com o Espiritismo. Obra de estudo e prática do evangelho no lar e na convivência cristã.",
      categories: { connect: [{ id: codificacao.id }] },
    },
  });

  await prisma.copy.upsert({
    where: { code: "EX-001" },
    update: {},
    create: { bookId: book1.id, code: "EX-001", status: "AVAILABLE" },
  });

  await prisma.copy.upsert({
    where: { code: "EX-002" },
    update: {},
    create: { bookId: book2.id, code: "EX-002", status: "AVAILABLE" },
  });

  await prisma.copy.upsert({
    where: { code: "EX-003" },
    update: {},
    create: { bookId: book2.id, code: "EX-003", status: "AVAILABLE" },
  });

  await prisma.copy.upsert({
    where: { code: "EX-004" },
    update: {},
    create: { bookId: book3.id, code: "EX-004", status: "AVAILABLE" },
  });

  console.log("Seed concluído!");
  console.log("Admin:", admin.email, "/ senha: admin123");
  console.log("Leitor:", reader.email, "/ senha: leitor123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
