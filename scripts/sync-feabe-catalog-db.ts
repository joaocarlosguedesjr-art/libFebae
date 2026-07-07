import fs from "node:fs";
import path from "node:path";
import { PrismaClient } from "../src/generated/prisma";
import { groupFeabeRows } from "../src/lib/catalog-feabe";
import {
  loadRowsFromEnrichedCsv,
  writeEnrichedCatalog,
} from "./reorganize-feabe-catalog";

const prisma = new PrismaClient();
const BATCH_SIZE = 50;
const REPORT_PATH = path.join(process.cwd(), "data", "feabe-sync-report.json");

type WorkGroup = ReturnType<typeof groupFeabeRows>[number];

type SyncPlan = {
  generatedAt: string;
  csv: { works: number; copies: number };
  database: { books: number; copies: number; activeLoans: number };
  actions: {
    booksCreate: number;
    booksUpdate: number;
    copiesCreate: number;
    copiesUpdate: number;
    orphansDelete: number;
  };
  samples: {
    booksCreate: Array<{ workNumber: number; title: string; author: string }>;
    booksUpdate: Array<{ workNumber: number; title: string; from: number | null; to: number }>;
    orphans: Array<{ id: string; title: string; workNumber: number | null }>;
  };
  blockers: string[];
  alreadyInSync: boolean;
};

function log(phase: string, message: string) {
  const ts = new Date().toISOString().slice(11, 19);
  console.log(`[${ts}] ${phase} — ${message}`);
}

function loadCatalogGroups() {
  const csvPath = path.join(process.cwd(), "data", "feabe-acervo-enriquecido.csv");
  if (!fs.existsSync(csvPath)) {
    throw new Error(`Arquivo não encontrado: ${csvPath}`);
  }

  const rows = loadRowsFromEnrichedCsv(csvPath);
  const groups = groupFeabeRows(rows);
  const { summary } = writeEnrichedCatalog(groups, path.join(process.cwd(), "data"), "reorganize");
  const targetCopies = groups.reduce((n, g) => n + g.copies.length, 0);

  return { csvPath, groups, summary, targetCopies };
}

async function buildSyncPlan(groups: WorkGroup[]): Promise<SyncPlan> {
  const [dbBooks, dbCopies, activeLoans] = await Promise.all([
    prisma.book.findMany({ include: { copies: true } }),
    prisma.copy.count(),
    prisma.loan.count({ where: { status: { in: ["ACTIVE", "OVERDUE"] } } }),
  ]);

  const copiesByLegacy = new Map<number, { id: string; bookId: string }>();
  for (const book of dbBooks) {
    for (const copy of book.copies) {
      if (copy.legacyNumber != null) {
        copiesByLegacy.set(copy.legacyNumber, { id: copy.id, bookId: book.id });
      }
    }
  }

  const usedBookIds = new Set<string>();
  let booksCreate = 0;
  let booksUpdate = 0;
  let copiesCreate = 0;
  let copiesUpdate = 0;
  const createSamples: SyncPlan["samples"]["booksCreate"] = [];
  const updateSamples: SyncPlan["samples"]["booksUpdate"] = [];

  for (const work of groups) {
    const legacyIds = work.copies.map((c) => c.legacyNumber);
    const matchedCopy = legacyIds.map((id) => copiesByLegacy.get(id)).find(Boolean);
    const existingBook = matchedCopy
      ? dbBooks.find((b) => b.id === matchedCopy.bookId)
      : undefined;

    if (existingBook) {
      usedBookIds.add(existingBook.id);
      const needsUpdate =
        existingBook.workNumber !== work.workNumber ||
        existingBook.title !== work.title ||
        existingBook.author !== work.author ||
        existingBook.authorGroup !== work.authorGroup ||
        existingBook.medium !== work.medium;

      if (needsUpdate) {
        booksUpdate++;
        if (updateSamples.length < 8) {
          updateSamples.push({
            workNumber: work.workNumber,
            title: work.title,
            from: existingBook.workNumber,
            to: work.workNumber,
          });
        }
      }
    } else {
      booksCreate++;
      if (createSamples.length < 8) {
        createSamples.push({
          workNumber: work.workNumber,
          title: work.title,
          author: work.author,
        });
      }
    }

    for (const copy of work.copies) {
      const existing = copiesByLegacy.get(copy.legacyNumber);
      if (existing) {
        const dbCopy = dbBooks
          .flatMap((b) => b.copies)
          .find((c) => c.id === existing.id);
        const targetBookId = existingBook?.id;
        const needsUpdate =
          !!dbCopy &&
          (dbCopy.code !== copy.copyCode ||
            dbCopy.shelfOrder !== copy.shelfOrder ||
            (targetBookId != null && existing.bookId !== targetBookId));
        if (needsUpdate) copiesUpdate++;
      } else {
        copiesCreate++;
      }
    }
  }

  const orphans = dbBooks.filter((b) => !usedBookIds.has(b.id));
  const blockers: string[] = [];
  if (activeLoans > 0) {
    blockers.push(`${activeLoans} empréstimo(s) ativo(s) — devolva antes de sincronizar.`);
  }

  const targetCopies = groups.reduce((n, g) => n + g.copies.length, 0);
  const alreadyInSync =
    blockers.length === 0 &&
    booksCreate === 0 &&
    booksUpdate === 0 &&
    copiesCreate === 0 &&
    copiesUpdate === 0 &&
    orphans.length === 0 &&
    dbBooks.length === groups.length &&
    dbCopies === targetCopies;

  return {
    generatedAt: new Date().toISOString(),
    csv: { works: groups.length, copies: targetCopies },
    database: { books: dbBooks.length, copies: dbCopies, activeLoans },
    actions: {
      booksCreate,
      booksUpdate,
      copiesCreate,
      copiesUpdate,
      orphansDelete: orphans.length,
    },
    samples: {
      booksCreate: createSamples,
      booksUpdate: updateSamples,
      orphans: orphans.slice(0, 8).map((b) => ({
        id: b.id,
        title: b.title,
        workNumber: b.workNumber,
      })),
    },
    blockers,
    alreadyInSync,
  };
}

function printPlan(plan: SyncPlan) {
  console.log("\n── Plano de sincronização ──");
  console.log(`  CSV:      ${plan.csv.works} obras · ${plan.csv.copies} exemplares`);
  console.log(`  Banco:    ${plan.database.books} obras · ${plan.database.copies} exemplares`);
  console.log(`  Empréstimos ativos: ${plan.database.activeLoans}`);
  console.log("\n  Ações previstas:");
  console.log(`    Criar obras:      ${plan.actions.booksCreate}`);
  console.log(`    Atualizar obras:  ${plan.actions.booksUpdate}`);
  console.log(`    Criar exemplares: ${plan.actions.copiesCreate}`);
  console.log(`    Atualizar exemplares: ${plan.actions.copiesUpdate}`);
  console.log(`    Remover órfãos:   ${plan.actions.orphansDelete}`);

  if (plan.blockers.length > 0) {
    console.log("\n  Bloqueios:");
    for (const b of plan.blockers) console.log(`    ✗ ${b}`);
  }

  if (plan.alreadyInSync) {
    console.log("\n  ✓ Banco já está alinhado com o CSV.");
  }
}

async function ensureCategories(groups: WorkGroup[]) {
  const names = [...new Set(groups.flatMap((g) => g.categories))].sort();
  log("FASE 2", `Garantindo ${names.length} categorias...`);
  for (const name of names) {
    await prisma.category.upsert({
      where: { name },
      create: { name },
      update: {},
    });
  }
}

async function bumpExistingWorkNumbers() {
  await prisma.$executeRaw`
    UPDATE "Book"
    SET "workNumber" = "workNumber" + 100000
    WHERE "workNumber" IS NOT NULL AND "workNumber" < 100000
  `;
}

async function syncWork(
  work: WorkGroup,
  copiesByLegacy: Map<number, { id: string; bookId: string }>,
  booksById: Map<string, { id: string }>,
) {
  const legacyIds = work.copies.map((c) => c.legacyNumber);
  const matchedCopy = legacyIds.map((id) => copiesByLegacy.get(id)).find(Boolean);

  const bookData = {
    workNumber: work.workNumber,
    catalogNumber: work.catalogNumber,
    authorGroup: work.authorGroup,
    title: work.title,
    author: work.author,
    medium: work.medium,
    workType: work.workType,
    collection: work.collection,
    language: work.language,
    publisher: work.publisher,
    synopsis: work.synopsis,
    notes: [
      `Catálogo FEABE obra nº ${work.workNumber}`,
      `Legado(s): ${legacyIds.join(", ")}`,
      `Sync ${new Date().toISOString().slice(0, 10)}`,
    ].join(" · "),
    categories: {
      connect: work.categories.map((name) => ({ name })),
    },
  };

  let bookId = matchedCopy?.bookId;

  if (bookId) {
    await prisma.book.update({
      where: { id: bookId },
      data: {
        ...bookData,
        categories: { set: work.categories.map((name) => ({ name })) },
      },
    });
  } else {
    const created = await prisma.book.create({ data: bookData });
    bookId = created.id;
    booksById.set(bookId, created);
  }

  for (const copy of work.copies) {
    const existing = copiesByLegacy.get(copy.legacyNumber);
    if (existing) {
      await prisma.copy.update({
        where: { id: existing.id },
        data: {
          bookId,
          code: copy.copyCode,
          shelfOrder: copy.shelfOrder,
          legacyNumber: copy.legacyNumber,
        },
      });
    } else {
      const created = await prisma.copy.create({
        data: {
          bookId,
          code: copy.copyCode,
          legacyNumber: copy.legacyNumber,
          shelfOrder: copy.shelfOrder,
          status: "AVAILABLE",
        },
      });
      copiesByLegacy.set(copy.legacyNumber, { id: created.id, bookId });
    }
  }

  return bookId;
}

async function applySync(groups: WorkGroup[]) {
  await ensureCategories(groups);

  const books = await prisma.book.findMany({ include: { copies: true } });
  const copiesByLegacy = new Map<number, { id: string; bookId: string }>();
  const booksById = new Map(books.map((b) => [b.id, b]));
  const usedBookIds = new Set<string>();

  for (const book of books) {
    for (const copy of book.copies) {
      if (copy.legacyNumber != null) {
        copiesByLegacy.set(copy.legacyNumber, { id: copy.id, bookId: book.id });
      }
    }
  }

  if (books.length > 0) {
    log("FASE 3", "Renumerando obras existentes (fase temporária)...");
    await bumpExistingWorkNumbers();
  }

  log("FASE 3", `Aplicando ${groups.length} obras...`);
  for (let i = 0; i < groups.length; i++) {
    const bookId = await syncWork(groups[i], copiesByLegacy, booksById);
    usedBookIds.add(bookId);

    if ((i + 1) % BATCH_SIZE === 0 || i === groups.length - 1) {
      log("FASE 3", `Progresso ${i + 1}/${groups.length}`);
    }
  }

  const orphanBooks = books.filter((b) => !usedBookIds.has(b.id));
  if (orphanBooks.length > 0) {
    log("FASE 3", `Removendo ${orphanBooks.length} obra(s) órfã(s)...`);
    for (const orphan of orphanBooks) {
      await prisma.copy.deleteMany({ where: { bookId: orphan.id } });
      await prisma.book.delete({ where: { id: orphan.id } });
    }
  }
}

async function verifySync(groups: WorkGroup[]) {
  const [dbBooks, dbCopies] = await Promise.all([
    prisma.book.count(),
    prisma.copy.count(),
  ]);

  const targetCopies = groups.reduce((n, g) => n + g.copies.length, 0);
  const errors: string[] = [];

  if (dbBooks !== groups.length) {
    errors.push(`Obras: esperado ${groups.length}, encontrado ${dbBooks}`);
  }
  if (dbCopies !== targetCopies) {
    errors.push(`Exemplares: esperado ${targetCopies}, encontrado ${dbCopies}`);
  }

  const first = await prisma.book.findFirst({
    orderBy: { workNumber: "asc" },
    select: { workNumber: true, title: true, author: true },
  });

  if (!first || first.workNumber !== 1 || first.author !== "Allan Kardec") {
    errors.push("Primeira obra não é Allan Kardec nº 1.");
  }

  const legacyInCsv = new Set(groups.flatMap((g) => g.copies.map((c) => c.legacyNumber)));
  const legacyInDb = await prisma.copy.findMany({
    where: { legacyNumber: { not: null } },
    select: { legacyNumber: true },
  });
  const dbLegacy = new Set(legacyInDb.map((c) => c.legacyNumber!));

  for (const id of legacyInCsv) {
    if (!dbLegacy.has(id)) errors.push(`Exemplar legado ${id} ausente no banco.`);
  }

  return {
    ok: errors.length === 0,
    books: dbBooks,
    copies: dbCopies,
    first,
    errors,
  };
}

function writeReport(payload: Record<string, unknown>) {
  fs.mkdirSync(path.dirname(REPORT_PATH), { recursive: true });
  fs.writeFileSync(REPORT_PATH, JSON.stringify(payload, null, 2), "utf8");
  log("RELATÓRIO", REPORT_PATH);
}

async function main() {
  const planOnly = process.argv.includes("--plan") || process.argv.includes("--dry-run");
  const applyOnly = process.argv.includes("--apply-only");
  const skipCsvWrite = process.argv.includes("--skip-csv-write");

  log("FASE 0", "Carregando catálogo...");
  const { groups, summary, targetCopies } = loadCatalogGroups();

  if (!skipCsvWrite) {
    console.log("Catálogo reorganizado (autor → espírito → obra)");
    console.log(`  Obras: ${summary.uniqueWorks}`);
    console.log(`  Exemplares: ${summary.totalCopies}`);
    console.log(`  Obras com vários exemplares: ${summary.multiCopyWorks}`);
  }

  log("FASE 1", "Pré-checagem e plano...");
  const plan = await buildSyncPlan(groups);
  printPlan(plan);

  if (plan.blockers.length > 0) {
    writeReport({ status: "blocked", plan });
    process.exit(1);
  }

  if (planOnly || plan.alreadyInSync) {
    writeReport({ status: plan.alreadyInSync ? "in_sync" : "planned", plan });
    if (plan.alreadyInSync) {
      log("FASE 4", "Verificação final...");
      const verification = await verifySync(groups);
      if (verification.ok) log("FASE 4", "✓ Verificação OK.");
      else {
        console.log("  Avisos:", verification.errors.join("; "));
      }
    } else {
      console.log("\nModo plano — banco não alterado. Use `npm run catalog:sync` para aplicar.");
    }
    return;
  }

  if (!applyOnly) {
    log("FASE 2", "Iniciando aplicação controlada...");
  }

  const startedAt = Date.now();
  await applySync(groups);

  log("FASE 4", "Verificando integridade...");
  const verification = await verifySync(groups);

  if (!verification.ok) {
    writeReport({
      status: "failed_verification",
      plan,
      verification,
      durationMs: Date.now() - startedAt,
    });
    throw new Error(`Verificação falhou: ${verification.errors.join("; ")}`);
  }

  const report = {
    status: "success",
    plan,
    verification,
    durationMs: Date.now() - startedAt,
    completedAt: new Date().toISOString(),
  };

  writeReport(report);

  console.log("\n── Sincronização concluída ──");
  console.log(`  Obras:      ${verification.books}`);
  console.log(`  Exemplares: ${verification.copies}`);
  console.log(`  Primeira:   nº ${verification.first?.workNumber} — ${verification.first?.title}`);
  console.log(`  Duração:    ${Math.round(report.durationMs / 1000)}s`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
