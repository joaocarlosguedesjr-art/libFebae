/**
 * Reabre na fila as obras de Chico ainda pendentes que já foram tentadas
 * (not_found / skipped), para nova passada com Google Books / melhorias.
 *
 * Uso: npx tsx scripts/requeue-chico-failed.ts
 */
import { PrismaClient } from "../src/generated/prisma";
import { matchesMediumFilter } from "../src/lib/book-enrichment/medium-filter";
import {
  loadState,
  saveState,
  createDailyQuota,
  syncDailyQuota,
} from "../src/lib/book-enrichment";

const prisma = new PrismaClient();

async function main() {
  const state = loadState();
  if (!state) {
    console.error("Sem book-enrichment-state.json");
    process.exit(1);
  }

  const all = await prisma.book.findMany({
    select: {
      workNumber: true,
      title: true,
      medium: true,
      synopsis: true,
      coverImageUrl: true,
    },
  });

  const pending = all.filter(
    (b) =>
      b.workNumber != null &&
      matchesMediumFilter(b.medium, "chico") &&
      (!b.synopsis?.trim() || !b.coverImageUrl?.trim())
  );

  const pendingNums = new Set(pending.map((b) => b.workNumber!));
  const before = state.processedWorkNumbers.length;
  state.processedWorkNumbers = state.processedWorkNumbers.filter(
    (n) => !pendingNums.has(n)
  );
  const removed = before - state.processedWorkNumbers.length;

  syncDailyQuota(state);
  // Reset cota do dia para permitir nova passada imediatamente
  state.dailyQuota = createDailyQuota();
  state.queryCount = 0;
  state.updatedAt = new Date().toISOString();
  saveState(state);

  console.log(`Pendentes Chico: ${pending.length}`);
  console.log(`Removidas da lista processada: ${removed}`);
  console.log(`Ainda marcadas processadas: ${state.processedWorkNumbers.length}`);
  console.log("Cota diária zerada. Próximo passo:");
  console.log("  1) Ativar Books API (se ainda não):");
  console.log(
    "     https://console.developers.google.com/apis/api/books.googleapis.com/overview?project=572701380693"
  );
  console.log("  2) npx tsx scripts/test-google-books.ts");
  console.log("  3) npm run catalog:enrich-web:chico:resume");
  console.log("  4) npm run catalog:enrich-web:apply");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
