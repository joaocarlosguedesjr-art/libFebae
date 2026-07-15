/**
 * Verificação da cota diária (sem Google CSE).
 * Uso: npx tsx scripts/verify-book-enrichment.ts
 */
import {
  canRunAnotherQuery,
  canStartAnotherBook,
  createDailyQuota,
  dailyLimitStopReason,
  getDailyQuotaStatus,
  migrateState,
  recordBookProcessed,
  recordQueryUsed,
  syncDailyQuota,
} from "../src/lib/book-enrichment/daily-quota";
import { DAILY_BOOK_LIMIT, DAILY_QUERY_LIMIT } from "../src/lib/book-enrichment/types";
import { classifyEnrichment, scoreSource } from "../src/lib/book-enrichment/confidence-scorer";
import { extractPageMetadata } from "../src/lib/book-enrichment/metadata-extractor";
import { buildEnrichmentQueries } from "../src/lib/book-enrichment/query-builder";
import type { BookEnrichmentInput, EnrichmentState } from "../src/lib/book-enrichment/types";

const sampleBook: BookEnrichmentInput = {
  id: "test",
  workNumber: 21,
  title: "Nosso Lar",
  author: "André Luiz",
  medium: "Francisco Cândido Xavier",
  authorGroup: "André Luiz",
  synopsis: null,
  coverImageUrl: null,
};

const sampleHtml = `<!DOCTYPE html>
<html>
<head>
  <title>Nosso Lar — André Luiz — FEB</title>
  <meta property="og:title" content="Nosso Lar" />
  <meta property="og:description" content="Primeiro volume da série em que André Luiz descreve a vida no plano espiritual após a morte, revelando a organização do mundo espiritual e os trabalhos de assistência aos encarnados." />
  <meta property="og:image" content="https://www.febrasil.org.br/livros/nosso-lar/capa.jpg" />
</head>
<body>
  <h1>Nosso Lar</h1>
  <p>Obra psicografada por Francisco Cândido Xavier com o espírito André Luiz.</p>
</body>
</html>`;

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(`FALHA: ${message}`);
  console.log(`  OK: ${message}`);
}

function testDailyQuota(): void {
  console.log("\nCota diária:");

  const state: EnrichmentState = migrateState({
    version: 1,
    startedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    processedWorkNumbers: [],
    queryCount: 0,
    lastWorkNumber: null,
    dailyQuota: createDailyQuota(),
  } as EnrichmentState);

  assert(DAILY_BOOK_LIMIT === 80, `limite de livros = ${DAILY_BOOK_LIMIT}`);
  assert(DAILY_QUERY_LIMIT === 100, `limite de buscas API = ${DAILY_QUERY_LIMIT}`);

  for (let i = 0; i < DAILY_BOOK_LIMIT; i++) {
    assert(canStartAnotherBook(state), `livro ${i + 1} permitido`);
    recordBookProcessed(state);
  }
  assert(!canStartAnotherBook(state), "bloqueia após 80 livros");
  assert(dailyLimitStopReason(state)?.includes("80") === true, "mensagem de limite de livros");

  const queryState: EnrichmentState = {
    ...state,
    dailyQuota: { ...createDailyQuota(), booksProcessed: 0 },
  };
  for (let i = 0; i < DAILY_QUERY_LIMIT; i++) {
    assert(canRunAnotherQuery(queryState), `busca ${i + 1} permitida`);
    recordQueryUsed(queryState);
  }
  assert(!canRunAnotherQuery(queryState), "bloqueia após 100 buscas");

  syncDailyQuota(queryState);
  const status = getDailyQuotaStatus(queryState);
  assert(status.queriesRemaining === 0, "nenhuma busca restante");
}

function testPipeline(): void {
  console.log("\nPipeline de extração:");

  const queries = buildEnrichmentQueries(sampleBook);
  assert(queries.length >= 3, `queries geradas (${queries.length})`);

  const extracted = extractPageMetadata(
    "https://www.febrasil.org.br/livros/nosso-lar",
    sampleHtml
  );
  assert(extracted.synopsis != null, "sinopse extraída");
  assert(extracted.coverImageUrl != null, "capa extraída");

  const scored = scoreSource({
    book: sampleBook,
    url: extracted.url,
    tier: extracted.tier,
    pageText: extracted.pageText,
    resultTitle: "Nosso Lar — André Luiz",
    synopsis: extracted.synopsis,
    coverImageUrl: extracted.coverImageUrl,
    fromSnippetOnly: false,
  });
  assert(scored.confidence >= 80, `confiança alta (${scored.confidence})`);

  const classification = classifyEnrichment([scored], true, true);
  assert(classification.status === "auto_apply", `status ${classification.status}`);
}

function main(): void {
  console.log("Verificação offline do pipeline");
  testPipeline();
  testDailyQuota();
  console.log("\nTodas as verificações passaram.");
}

main();
