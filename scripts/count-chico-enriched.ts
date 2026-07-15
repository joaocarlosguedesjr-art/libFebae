import { PrismaClient } from "../src/generated/prisma";
import { matchesMediumFilter } from "../src/lib/book-enrichment/medium-filter";

const prisma = new PrismaClient();

async function main() {
  const all = await prisma.book.findMany({
    select: {
      workNumber: true,
      title: true,
      medium: true,
      synopsis: true,
      coverImageUrl: true,
    },
    orderBy: { workNumber: "asc" },
  });

  const chico = all.filter((b) => matchesMediumFilter(b.medium, "chico"));
  const withCover = chico.filter((b) => b.coverImageUrl?.trim());
  const withSyn = chico.filter((b) => b.synopsis?.trim());
  const withBoth = chico.filter(
    (b) => b.synopsis?.trim() && b.coverImageUrl?.trim()
  );
  const pending = chico.filter(
    (b) => !b.synopsis?.trim() || !b.coverImageUrl?.trim()
  );

  console.log("Chico total:", chico.length);
  console.log("Com capa:", withCover.length);
  console.log("Com sinopse:", withSyn.length);
  console.log("Com ambos:", withBoth.length);
  console.log("Ainda pendentes:", pending.length);
  console.log("\nAmostra com capa:");
  for (const b of withCover.slice(0, 8)) {
    console.log(
      `  #${b.workNumber} ${b.title}\n    ${b.coverImageUrl}`
    );
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
