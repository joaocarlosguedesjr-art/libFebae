import { PrismaClient } from "../src/generated/prisma";
import { matchesMediumFilter } from "../src/lib/book-enrichment/medium-filter";

const prisma = new PrismaClient();

async function main() {
  const all = await prisma.book.findMany({
    select: {
      workNumber: true,
      title: true,
      author: true,
      medium: true,
      synopsis: true,
      coverImageUrl: true,
    },
    orderBy: { workNumber: "asc" },
  });

  const chico = all.filter((b) => matchesMediumFilter(b.medium, "chico"));
  const chicoPrisma = all.filter((b) =>
    b.medium?.toLowerCase().includes("xavier")
  );
  const pending = chico.filter(
    (b) => !b.synopsis?.trim() || !b.coverImageUrl?.trim()
  );

  console.log(`Total obras no banco: ${all.length}`);
  console.log(`Obras com médium Chico Xavier: ${chico.length}`);
  console.log(`Obras com Xavier no medium (fallback): ${chicoPrisma.length}`);
  console.log(`Pendentes (sinopse ou capa): ${pending.length}`);
  console.log("\nAmostra de mediums distintos:");
  const mediums = [...new Set(all.map((b) => b.medium).filter(Boolean))].slice(0, 15);
  for (const m of mediums) console.log(`  - ${m}`);

  if (pending.length > 0) {
    console.log("\nPrimeiras 10 pendentes (Chico):");
    for (const b of pending.slice(0, 10)) {
      console.log(
        `  #${b.workNumber} ${b.title} | ${b.author} | sinopse=${!!b.synopsis?.trim()} capa=${!!b.coverImageUrl?.trim()}`
      );
    }
  }
}

main()
  .finally(() => prisma.$disconnect());
