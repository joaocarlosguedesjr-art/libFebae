import {
  classifyEnrichment,
  pickBestField,
  scoreSource,
} from "./confidence-scorer";
import {
  extractEmbeddedCoverUrl,
  searchDirectSources,
} from "./direct-search";
import { GoogleCseClient } from "./google-cse";
import { extractFromSnippet, extractPageMetadata } from "./metadata-extractor";
import { fetchPageHtml } from "./page-fetcher";
import { buildEnrichmentQueries } from "./query-builder";
import { getSourceTier } from "./source-tier";
import { cleanExtractedSynopsis } from "./text-utils";
import type {
  BookEnrichmentInput,
  CseSearchResult,
  EnrichmentResult,
  EnrichmentSource,
} from "./types";
import { REVIEW_CONFIDENCE_MIN, SYNOPSIS_MIN_LENGTH } from "./types";

const MAX_PAGES_PER_WORK = 12;
const PAGE_FETCH_DELAY_MS = 600;

function dedupeResults(results: CseSearchResult[]): CseSearchResult[] {
  const seen = new Set<string>();
  const out: CseSearchResult[] = [];
  for (const result of results) {
    const key = result.link.replace(/\/$/, "").toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(result);
  }
  return out;
}

function sortByTier(results: CseSearchResult[]): CseSearchResult[] {
  return [...results].sort((a, b) => getSourceTier(a.link) - getSourceTier(b.link));
}

function hasFoundPendingFields(
  sources: EnrichmentSource[],
  needsSynopsis: boolean,
  needsCover: boolean
): boolean {
  const synopsis = needsSynopsis
    ? pickBestField(sources, "synopsis", REVIEW_CONFIDENCE_MIN).value
    : true;
  const cover = needsCover
    ? pickBestField(sources, "coverImageUrl", REVIEW_CONFIDENCE_MIN).value
    : true;
  return Boolean(synopsis && cover);
}

function acceptSynopsis(value: string | null | undefined): string | null {
  if (!value) return null;
  const cleaned = cleanExtractedSynopsis(value);
  if (cleaned.length < SYNOPSIS_MIN_LENGTH) return null;
  return cleaned;
}

export type EnrichWorkOptions = {
  cse?: GoogleCseClient | null;
  onQuery?: () => void;
  canRunQuery?: () => boolean;
  preferDirect?: boolean;
};

async function processSearchResults(
  book: BookEnrichmentInput,
  results: CseSearchResult[],
  sources: EnrichmentSource[],
  visitedUrls: Set<string>,
  needsSynopsis: boolean,
  needsCover: boolean
): Promise<void> {
  const sorted = sortByTier(results);

  for (const result of sorted) {
    const urlKey = result.link.replace(/\/$/, "").toLowerCase();
    if (visitedUrls.has(urlKey)) continue;
    if (visitedUrls.size >= MAX_PAGES_PER_WORK) break;

    visitedUrls.add(urlKey);

    const embeddedCover = extractEmbeddedCoverUrl(result.snippet);
    const snippetSynopsis = acceptSynopsis(
      result.snippet.replace(/\s*Cover:\s*https?:\/\/\S+/i, " ")
    );

    // Open Library / Wikipedia já trazem metadados no snippet — evita HTML inútil
    const isMetadataApiHost =
      urlKey.includes("openlibrary.org") || urlKey.includes("wikipedia.org");

    if (isMetadataApiHost && (snippetSynopsis || embeddedCover)) {
      sources.push(
        scoreSource({
          book,
          url: result.link,
          tier: getSourceTier(result.link),
          pageText: `${result.title} ${result.snippet}`,
          resultTitle: result.title,
          synopsis: needsSynopsis ? snippetSynopsis : null,
          coverImageUrl: needsCover ? embeddedCover : null,
          fromSnippetOnly: !snippetSynopsis || snippetSynopsis.length < 120,
        })
      );
    } else {
      const fetched = await fetchPageHtml(result.link);

      if (fetched.html) {
        const extracted = extractPageMetadata(result.link, fetched.html);
        sources.push(
          scoreSource({
            book,
            url: result.link,
            tier: extracted.tier,
            pageText: extracted.pageText,
            resultTitle: result.title,
            synopsis: needsSynopsis ? extracted.synopsis ?? snippetSynopsis : null,
            coverImageUrl: needsCover
              ? extracted.coverImageUrl ?? embeddedCover
              : null,
            fromSnippetOnly: false,
          })
        );
      } else if (needsSynopsis && (snippetSynopsis || result.snippet)) {
        const extracted = extractFromSnippet(result.link, result.snippet, result.title);
        sources.push(
          scoreSource({
            book,
            url: result.link,
            tier: extracted.tier,
            pageText: extracted.pageText,
            resultTitle: result.title,
            synopsis: snippetSynopsis ?? extracted.synopsis,
            coverImageUrl: needsCover ? embeddedCover : null,
            fromSnippetOnly: true,
          })
        );
      }
    }

    if (PAGE_FETCH_DELAY_MS > 0) {
      await new Promise((resolve) => setTimeout(resolve, PAGE_FETCH_DELAY_MS));
    }

    if (hasFoundPendingFields(sources, needsSynopsis, needsCover)) {
      break;
    }
  }
}

export async function enrichWork(
  book: BookEnrichmentInput,
  options: EnrichWorkOptions = {}
): Promise<EnrichmentResult> {
  const needsSynopsis = !book.synopsis?.trim();
  const needsCover = !book.coverImageUrl?.trim();
  const sources: EnrichmentSource[] = [];
  const visitedUrls = new Set<string>();
  const executedQueries: string[] = [];
  const preferDirect = options.preferDirect !== false;

  if (!needsSynopsis && !needsCover) {
    return {
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
      queries: [],
      reason: "Obra já possui sinopse e capa",
      researchedAt: new Date().toISOString(),
      needsSynopsis: false,
      needsCover: false,
    };
  }

  // 1) Busca direta (não depende do Google CSE)
  if (preferDirect) {
    if (!options.canRunQuery || options.canRunQuery()) {
      const direct = await searchDirectSources(book, {
        onProvider: (id) => {
          executedQueries.push(`direct:${id}`);
          options.onQuery?.();
        },
        canRunProvider: options.canRunQuery,
      });

      await processSearchResults(
        book,
        direct.results,
        sources,
        visitedUrls,
        needsSynopsis,
        needsCover
      );
    }
  }

  // 2) Fallback opcional ao Google CSE (só se o cliente for passado explicitamente)
  const cse = options.cse ?? null;

  if (
    cse &&
    !hasFoundPendingFields(sources, needsSynopsis, needsCover) &&
    (!options.canRunQuery || options.canRunQuery())
  ) {
    const queries = buildEnrichmentQueries(book);
    for (const query of queries) {
      if (options.canRunQuery && !options.canRunQuery()) break;
      if (hasFoundPendingFields(sources, needsSynopsis, needsCover)) break;

      try {
        executedQueries.push(`cse:${query}`);
        const results = await cse.search(query);
        options.onQuery?.();
        await processSearchResults(
          book,
          dedupeResults(results),
          sources,
          visitedUrls,
          needsSynopsis,
          needsCover
        );
      } catch (error) {
        const message = error instanceof Error ? error.message : "CSE indisponível";
        executedQueries.push(`cse-error:${message}`);
        break;
      }
    }
  }

  const synopsisPick = needsSynopsis
    ? pickBestField(sources, "synopsis", REVIEW_CONFIDENCE_MIN)
    : { value: null, source: null };
  const coverPick = needsCover
    ? pickBestField(sources, "coverImageUrl", REVIEW_CONFIDENCE_MIN)
    : { value: null, source: null };

  const classification = classifyEnrichment(
    sources,
    Boolean(synopsisPick.value),
    Boolean(coverPick.value)
  );

  return {
    workNumber: book.workNumber,
    bookId: book.id,
    title: book.title,
    author: book.author,
    medium: book.medium,
    status: classification.status,
    synopsis: synopsisPick.value,
    coverImageUrl: coverPick.value,
    confidence: classification.confidence,
    sources,
    queries: executedQueries,
    reason: classification.reason,
    researchedAt: new Date().toISOString(),
    needsSynopsis,
    needsCover,
  };
}
