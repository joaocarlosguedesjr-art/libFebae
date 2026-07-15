/**
 * Reabre na fila TODAS as obras ainda sem sinopse ou capa (qualquer médium),
 * e zera a cota do dia para permitir varredura contínua.
 *
 * Uso: npx tsx scripts/requeue-all-pending.ts
 */
import { PrismaClient } from "../src/generated/prisma";
import {
  createDailyQuota,
  loadState,
  saveState,
  syncDailyQuota,
} from "../src/lib/book-enrichment";

const prisma = new PrismaClient();

async function main() {
  let state = loadState();
  if (!state) {
    state = {
      version: 2,
      startedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      processedWorkNumbers: [],
      queryCount: 0,
      lastWorkNumber: null,
      dailyQuota: createDailyQuota(),
    };
  }

  const all = await prisma.book.findMany({
    select: {
      workNumber: true,
      synopsis: true,
      coverImageUrl: true,
    },
  });

  const pending = all.filter(
    (b) =>
      b.workNumber != null &&
      (!b.synopsis?.trim() || !b.coverImageUrl?.trim())
  );
  const pendingNums = new Set(pending.map((b) => b.workNumber!));

  const before = state.processedWorkNumbers.length;
  state.processedWorkNumbers = state.processedWorkNumbers.filter(
    (n) => !pendingNums.has(n)
  );
  const removed = before - state.processedWorkNumbers.length;

  syncDailyQuota(state);
  state.dailyQuota = createDailyQuota();
  state.queryCount = 0;
  state.updatedAt = new Date().toISOString();
  saveState(state);

  console.log(`Obras no acervo: ${all.length}`);
  console.log(`Pendentes (sinopse ou capa): ${pending.length}`);
  console.log(`Reabertas na fila: ${removed}`);
  console.log(`Cota zerada para nova passada contínua`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
