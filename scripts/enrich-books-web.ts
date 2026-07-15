import fs from "node:fs";
import path from "node:path";
import { PrismaClient } from "../src/generated/prisma";
import {
  appendReviewCsvRow,
  buildEnrichmentQueries,
  buildReport,
  canRunAnotherQuery,
  canStartAnotherBook,
  createDailyQuota,
  dailyLimitStopReason,
  enrichWork,
  getDailyQuotaStatus,
  getGoogleCseConfig,
  GoogleCseClient,
  isFatalApiConfigError,
  isRetryableApiError,
  loadResults,
  loadState,
  migrateState,
  recordBookProcessed,
  recordQueryUsed,
  REVIEW_CSV_PATH,
  saveResults,
  saveState,
  syncDailyQuota,
  writeReport,
  DAILY_BOOK_LIMIT,
  DAILY_QUERY_LIMIT,
  matchesMediumFilter,
  type BookEnrichmentInput,
  type EnrichmentResult,
  type EnrichmentState,
} from "../src/lib/book-enrichment";

const prisma = new PrismaClient();
const WORK_DELAY_MS = Number(process.env.BOOK_ENRICHMENT_WORK_DELAY_MS ?? 2000);

type CliOptions = {
  plan: boolean;
  resume: boolean;
  limit: number | null;
  workNumber: number | null;
  medium: string | null;
};

function parseArgs(argv: string[]): CliOptions {
  const options: CliOptions = {
    plan: argv.includes("--plan"),
    resume: argv.includes("--resume"),
    limit: null,
    workNumber: null,
    medium: null,
  };

  const limitIdx = argv.indexOf("--limit");
  if (limitIdx >= 0 && argv[limitIdx + 1]) {
    options.limit = Number(argv[limitIdx + 1]);
  }

  const workIdx = argv.indexOf("--work-number");
  if (workIdx >= 0 && argv[workIdx + 1]) {
    options.workNumber = Number(argv[workIdx + 1]);
  }

  const mediumIdx = argv.indexOf("--medium");
  if (mediumIdx >= 0 && argv[mediumIdx + 1]) {
    options.medium = argv[mediumIdx + 1]!;
  }

  return options;
}

function log(message: string): void {
  const ts = new Date().toISOString().slice(11, 19);
  console.log(`[${ts}] ${message}`);
}

function logCostSummary(queriesUsed: number, booksProcessed: number): void {
  const freeRemaining = Math.max(0, DAILY_QUERY_LIMIT - queriesUsed);
  const avgQueries = booksProcessed > 0 ? (queriesUsed / booksProcessed).toFixed(1) : "0";
  const paidQueries = Math.max(0, queriesUsed - DAILY_QUERY_LIMIT);
  const estimatedUsd = (paidQueries / 1000) * 5;

  log("--- Custos da consulta (estimativa) ---");
  log(`  Buscas API hoje: ${queriesUsed} (média ${avgQueries}/livro)`);
  log(`  Cota gratuita restante hoje: ${freeRemaining}/${DAILY_QUERY_LIMIT}`);
  if (paidQueries > 0) {
    log(`  Buscas pagas: ${paidQueries} (~US$ ${estimatedUsd.toFixed(2)})`);
  } else {
    log("  Custo hoje: US$ 0,00 (dentro da cota gratuita)");
  }
}

async function loadPendingBooks(options: CliOptions): Promise<BookEnrichmentInput[]> {
  const where = options.workNumber
    ? { workNumber: options.workNumber }
    : {
        OR: [{ synopsis: null }, { synopsis: "" }, { coverImageUrl: null }, { coverImageUrl: "" }],
      };

  const books = await prisma.book.findMany({
    where,
    orderBy: { workNumber: "asc" },
    select: {
      id: true,
      workNumber: true,
      title: true,
      author: true,
      medium: true,
      authorGroup: true,
      synopsis: true,
      coverImageUrl: true,
    },
  });

  const mapped = books
    .filter((b): b is typeof b & { workNumber: number } => b.workNumber != null)
    .map((b) => ({
      id: b.id,
      workNumber: b.workNumber,
      title: b.title,
      author: b.author,
      medium: b.medium,
      authorGroup: b.authorGroup,
      synopsis: b.synopsis,
      coverImageUrl: b.coverImageUrl,
    }));

  const processed = new Set(
    options.resume ? (loadState()?.processedWorkNumbers ?? []) : []
  );

  let filtered = mapped.filter((b) => !processed.has(b.workNumber));
  if (!options.resume) {
    filtered = mapped;
  }

  if (options.medium) {
    filtered = filtered.filter((b) => matchesMediumFilter(b.medium, options.medium!));
  }

  if (options.limit != null && options.limit > 0) {
    filtered = filtered.slice(0, options.limit);
  }

  return filtered;
}

function initState(resume: boolean): EnrichmentState {
  if (resume) {
    const existing = loadState();
    if (existing) {
      syncDailyQuota(existing);
      return existing;
    }
  }

  return {
    version: 2,
    startedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    processedWorkNumbers: [],
    queryCount: 0,
    lastWorkNumber: null,
    dailyQuota: createDailyQuota(),
  };
}

async function runPlan(books: BookEnrichmentInput[], options: CliOptions): Promise<void> {
  const state = loadState();
  const quota = state ? getDailyQuotaStatus(migrateState(state)) : null;

  log(`Modo plano — ${books.length} obra(s) pendente(s)`);
  if (options.medium) {
    log(`Filtro de médium: ${options.medium}`);
  }
  log(
    `Limites diários: até ${DAILY_BOOK_LIMIT} livros e ${DAILY_QUERY_LIMIT} provedores/buscas`
  );
  log(
    "Provedores: Livraria Espírita (Tier 1), Open Library / Wikipedia PT (Tier 2); Google CSE só se liberado"
  );
  if (quota) {
    log(
      `Cota de hoje (${quota.date}): ${quota.booksProcessed}/${DAILY_BOOK_LIMIT} livros, ` +
        `${quota.queriesUsed}/${DAILY_QUERY_LIMIT} buscas`
    );
  }

  const maxToday = quota
    ? Math.min(books.length, quota.booksRemaining)
    : Math.min(books.length, DAILY_BOOK_LIMIT);
  if (maxToday < books.length) {
    log(`Nesta execução seriam processadas no máximo ${maxToday} obra(s) hoje`);
  }

  for (const book of books.slice(0, maxToday)) {
    const queries = buildEnrichmentQueries(book);
    const needs = [
      !book.synopsis?.trim() ? "sinopse" : null,
      !book.coverImageUrl?.trim() ? "capa" : null,
    ]
      .filter(Boolean)
      .join(", ");

    console.log(`\n#${book.workNumber} — ${book.title} (${book.author})`);
    console.log(`  Pendente: ${needs || "nada"}`);
    if (book.medium) console.log(`  Médium: ${book.medium}`);
    for (const query of queries) {
      console.log(`  → ${query}`);
    }
  }
}

async function runEnrichment(
  books: BookEnrichmentInput[],
  options: CliOptions
): Promise<void> {
  const config = getGoogleCseConfig();
  let cse = config ? new GoogleCseClient(config) : null;
  if (cse) {
    try {
      await cse.search('"Nosso Lar" Xavier', 1);
      log("Busca direta + fallback Google CSE disponível");
    } catch (error) {
      const message = error instanceof Error ? error.message : "CSE bloqueado";
      log(`Google CSE bloqueado (${message}) — usando apenas busca direta`);
      cse = null;
    }
  } else {
    log(
      "Google CSE ausente — usando busca direta (Livraria Espírita, Open Library, Wikipedia PT)"
    );
  }

  const state = initState(options.resume);
  const results = options.resume ? loadResults() : {};

  if (!options.resume && fs.existsSync(REVIEW_CSV_PATH)) {
    fs.unlinkSync(REVIEW_CSV_PATH);
  }

  syncDailyQuota(state);
  const quotaStart = getDailyQuotaStatus(state);
  const booksToday = books.slice(0, quotaStart.booksRemaining);

  log(`Iniciando enriquecimento de ${booksToday.length} obra(s) hoje (${books.length} na fila total)`);
  if (options.medium) {
    log(`Filtro de médium: ${options.medium} — só grava auto_apply com confiança ≥80 em fonte oficial`);
  }
  log(
    `Cota diária (${quotaStart.date}): ${quotaStart.booksProcessed}/${DAILY_BOOK_LIMIT} livros, ` +
      `${quotaStart.queriesUsed}/${DAILY_QUERY_LIMIT} buscas`
  );

  let stoppedByQuota = false;

  for (const book of booksToday) {
    syncDailyQuota(state);
    if (!canStartAnotherBook(state)) {
      const reason = dailyLimitStopReason(state);
      log(reason ?? "Limite diário atingido.");
      stoppedByQuota = true;
      break;
    }

    log(
      `Pesquisando #${book.workNumber}: ${book.title} ` +
        `(cota: ${state.dailyQuota.booksProcessed}/${DAILY_BOOK_LIMIT} livros, ` +
        `${state.dailyQuota.queriesUsed}/${DAILY_QUERY_LIMIT} buscas)`
    );

    try {
      const result: EnrichmentResult = await enrichWork(book, {
        cse,
        preferDirect: true,
        onQuery: () => {
          recordQueryUsed(state);
        },
        canRunQuery: () => canRunAnotherQuery(state),
      });

      results[String(book.workNumber)] = result;
      state.processedWorkNumbers.push(book.workNumber);
      state.lastWorkNumber = book.workNumber;
      state.updatedAt = new Date().toISOString();
      recordBookProcessed(state);

      saveResults(results);
      saveState(state);

      if (result.status === "needs_review") {
        appendReviewCsvRow(result);
      }

      log(
        `  → ${result.status} (confiança ${result.confidence})` +
          `${result.synopsis ? " +sinopse" : ""}` +
          `${result.coverImageUrl ? " +capa" : ""}` +
          ` [${result.queries.join(", ")}]`
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro desconhecido";
      log(`  → ERRO: ${message}`);

      if (isRetryableApiError(message)) {
        log("  → Obra NÃO marcada como processada (pode repetir após corrigir a API)");
      }

      results[String(book.workNumber)] = {
        workNumber: book.workNumber,
        bookId: book.id,
        title: book.title,
        author: book.author,
        medium: book.medium,
        status: "skipped",
        synopsis: null,
        coverImageUrl: null,
        confidence: 0,
        sources: [],
        queries: buildEnrichmentQueries(book),
        reason: message,
        researchedAt: new Date().toISOString(),
        needsSynopsis: !book.synopsis?.trim(),
        needsCover: !book.coverImageUrl?.trim(),
      };

      if (!isRetryableApiError(message)) {
        state.processedWorkNumbers.push(book.workNumber);
        recordBookProcessed(state);
      }

      saveResults(results);
      saveState(state);

      if (isFatalApiConfigError(message)) {
        log(
          "Continuando sem Google CSE (busca direta permanece ativa)."
        );
      }
    }

    if (!canStartAnotherBook(state)) {
      stoppedByQuota = true;
    }

    await new Promise((resolve) => setTimeout(resolve, WORK_DELAY_MS));
  }

  const report = buildReport(results);
  report.queryCount = state.queryCount;
  writeReport(report);

  const quotaEnd = getDailyQuotaStatus(state);
  log(stoppedByQuota ? "Pausado por limite diário" : "Concluído");
  log(
    `Resumo: auto=${report.autoApply} revisão=${report.needsReview} ` +
      `ignorados=${report.skipped} não encontrados=${report.notFound}`
  );
  log(
    `Cota de hoje: ${quotaEnd.booksProcessed}/${DAILY_BOOK_LIMIT} livros, ` +
      `${quotaEnd.queriesUsed}/${DAILY_QUERY_LIMIT} buscas`
  );
  logCostSummary(quotaEnd.queriesUsed, quotaEnd.booksProcessed);
  if (stoppedByQuota) {
    log("Continue amanhã com: npm run catalog:enrich-web:resume");
  }
  log(`Artefatos em ${path.join(process.cwd(), "data")}`);
}

async function main(): Promise<void> {
  const options = parseArgs(process.argv.slice(2));
  const books = await loadPendingBooks(options);

  if (books.length === 0) {
    log("Nenhuma obra pendente para enriquecer.");
    return;
  }

  if (options.plan) {
    await runPlan(books, options);
    return;
  }

  await runEnrichment(books, options);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
