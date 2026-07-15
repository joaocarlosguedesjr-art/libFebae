import { PrismaClient } from "../src/generated/prisma";
import { matchesMediumFilter } from "../src/lib/book-enrichment/medium-filter";
import { loadState } from "../src/lib/book-enrichment/persistence";

const prisma = new PrismaClient();

async function main() {
  const state = loadState();
  const processed = new Set(state?.processedWorkNumbers ?? []);
  const all = await prisma.book.findMany({
    select: {
      workNumber: true,
      synopsis: true,
      coverImageUrl: true,
      medium: true,
    },
  });
  const chico = all.filter(
    (b) => b.workNumber != null && matchesMediumFilter(b.medium, "chico")
  );
  const pending = chico.filter(
    (b) => !b.synopsis?.trim() || !b.coverImageUrl?.trim()
  );
  const neverTried = pending.filter((b) => !processed.has(b.workNumber!));
  const triedFail = pending.filter((b) => processed.has(b.workNumber!));
  console.log("pendentes", pending.length);
  console.log("nunca pesquisadas", neverTried.length);
  console.log("ja tentadas sem sucesso", triedFail.length);
  console.log("cota", state?.dailyQuota);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
