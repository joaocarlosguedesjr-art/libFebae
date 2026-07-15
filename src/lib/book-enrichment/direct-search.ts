import { searchGoogleBooks, googleBooksBlockedHint } from "./google-books";
import { fetchPageHtml } from "./page-fetcher";
import { getSourceTier } from "./source-tier";
import {
  nameAppearsInText,
  normalizeText,
  titleSimilarityScore,
} from "./text-utils";
import type { BookEnrichmentInput, CseSearchResult } from "./types";
import { TITLE_SIMILARITY_THRESHOLD } from "./types";

const USER_AGENT = "BibliotecaFEABE-Enrichment/1.0 (+local-catalog)";

async function fetchJson<T>(url: string): Promise<T | null> {
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": USER_AGENT,
        Accept: "application/json",
      },
    });
    if (!response.ok) return null;
    return (await response.json()) as T;
  } catch {
    return null;
  }
}

function absoluteUrl(href: string, base: string): string | null {
  try {
    return new URL(href, base).href;
  } catch {
    return null;
  }
}

function isLikelyProductUrl(url: string): boolean {
  const lower = url.toLowerCase();
  if (lower.includes("busca") || lower.includes("?s=")) return false;
  if (lower.includes("login") || lower.includes("cart") || lower.includes("checkout")) {
    return false;
  }
  return true;
}

function matchesBookIdentity(
  book: BookEnrichmentInput,
  title: string,
  haystack: string
): boolean {
  const titleScore = titleSimilarityScore(book.title, title);
  if (titleScore < TITLE_SIMILARITY_THRESHOLD * 100) return false;

  const authorOk =
    nameAppearsInText(book.author, haystack) ||
    (book.authorGroup ? nameAppearsInText(book.authorGroup, haystack) : false);
  if (!authorOk) return false;

  if (book.medium && !nameAppearsInText(book.medium, haystack)) {
    // médium ajuda a confirmar, mas não descarta se título+autor já batem em fonte dedicada
    const mediumTokens = normalizeText(book.medium).split(" ").filter((t) => t.length > 3);
    const hit = mediumTokens.some((token) => normalizeText(haystack).includes(token));
    if (!hit && titleScore < 95) return false;
  }

  return true;
}

/** Busca na Livraria Espírita (Magento catalogsearch) — sinopses e capas do acervo. */
export async function searchLivrariaEspirita(
  book: BookEnrichmentInput
): Promise<CseSearchResult[]> {
  // Magento costuma falhar com autor+título longos; busca pelo título primeiro.
  const queries = [
    book.title,
    normalizeText(book.title),
    [book.title, book.author].filter(Boolean).join(" "),
  ];

  const results: CseSearchResult[] = [];
  const seen = new Set<string>();

  for (const query of queries) {
    if (!query.trim()) continue;
    const searchUrl =
      "https://www.livrariaespirita.org.br/catalogsearch/result/?" +
      new URLSearchParams({ q: query }).toString();
    const fetched = await fetchPageHtml(searchUrl);
    if (!fetched.html) continue;

    // Atributos Magento podem vir quebrados em linhas: href="..."\ntitle="..."
    const pattern =
      /product-name["']?\s*>\s*<a\s+href=["']([^"']+)["'][\s\S]{0,200}?title=["']([^"']+)["']/gi;

    let match: RegExpExecArray | null;
    while ((match = pattern.exec(fetched.html)) !== null) {
      const href = absoluteUrl(match[1]!, searchUrl);
      const title = match[2]!.replace(/\s+/g, " ").trim();
      if (!href || !title || !isLikelyProductUrl(href)) continue;
      if (titleSimilarityScore(book.title, title) < TITLE_SIMILARITY_THRESHOLD * 100) {
        continue;
      }

      const key = href.replace(/\/$/, "").toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      results.push({
        title,
        link: href,
        snippet: title,
        displayLink: "livrariaespirita.org.br",
      });
      if (results.length >= 5) break;
    }

    if (results.length >= 3) break;
  }

  return results;
}

type OpenLibraryDoc = {
  key?: string;
  title?: string;
  author_name?: string[];
  cover_i?: number;
  isbn?: string[];
  publisher?: string[];
  first_sentence?: string[] | string;
};

type OpenLibrarySearch = {
  docs?: OpenLibraryDoc[];
};

type OpenLibraryWork = {
  description?: string | { value?: string };
  title?: string;
  covers?: number[];
};

function openLibraryDescription(work: OpenLibraryWork | null): string | null {
  if (!work?.description) return null;
  if (typeof work.description === "string") return work.description;
  return work.description.value ?? null;
}

/** Open Library — capas estáveis e descrição quando disponível. */
export async function searchOpenLibrary(
  book: BookEnrichmentInput
): Promise<CseSearchResult[]> {
  const asciiQuery = normalizeText(
    [book.title, book.author, book.medium ?? ""].filter(Boolean).join(" ")
  );
  const searchUrl =
    "https://openlibrary.org/search.json?" +
    new URLSearchParams({
      q: asciiQuery,
      limit: "8",
      fields: "key,title,author_name,cover_i,isbn,publisher,first_sentence",
    }).toString();

  const data = await fetchJson<OpenLibrarySearch>(searchUrl);
  if (!data?.docs?.length) return [];

  const results: CseSearchResult[] = [];
  for (const doc of data.docs) {
    if (!doc.key || !doc.title) continue;
    const authors = (doc.author_name ?? []).join(" ");
    const haystack = `${doc.title} ${authors} ${(doc.publisher ?? []).join(" ")}`;
    if (!matchesBookIdentity(book, doc.title, haystack)) continue;

    const workUrl = `https://openlibrary.org${doc.key}`;
    const work = await fetchJson<OpenLibraryWork>(`${workUrl}.json`);
    const description =
      openLibraryDescription(work) ??
      (Array.isArray(doc.first_sentence)
        ? doc.first_sentence.join(" ")
        : doc.first_sentence) ??
      "";

    const coverId = doc.cover_i ?? work?.covers?.[0];
    const coverHint = coverId
      ? ` Cover: https://covers.openlibrary.org/b/id/${coverId}-L.jpg`
      : "";

    results.push({
      title: doc.title,
      link: workUrl,
      snippet: `${description}${coverHint}`.trim(),
      displayLink: "openlibrary.org",
    });
  }

  return results;
}

type WikiOpenSearch = [string, string[], string[], string[]];

type WikiSummary = {
  title?: string;
  extract?: string;
  description?: string;
  content_urls?: { desktop?: { page?: string } };
  thumbnail?: { source?: string };
  originalimage?: { source?: string };
  type?: string;
};

/** Wikipedia PT — sinopses curtas e capas para obras conhecidas. */
export async function searchWikipediaPt(
  book: BookEnrichmentInput
): Promise<CseSearchResult[]> {
  const openUrl =
    "https://pt.wikipedia.org/w/api.php?" +
    new URLSearchParams({
      action: "opensearch",
      search: book.title,
      limit: "5",
      namespace: "0",
      format: "json",
    }).toString();

  const open = await fetchJson<WikiOpenSearch>(openUrl);
  if (!open || !Array.isArray(open) || open.length < 4) return [];

  const titles = open[1] ?? [];
  const urls = open[3] ?? [];
  const results: CseSearchResult[] = [];

  for (let i = 0; i < titles.length; i++) {
    const title = titles[i]!;
    const pageUrl = urls[i];
    if (!pageUrl) continue;
    if (titleSimilarityScore(book.title, title) < TITLE_SIMILARITY_THRESHOLD * 100) continue;

    const summaryUrl = `https://pt.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(
      title.replace(/ /g, "_")
    )}`;
    const summary = await fetchJson<WikiSummary>(summaryUrl);
    if (!summary || summary.type === "disambiguation") continue;

    const extract = summary.extract ?? summary.description ?? "";
    const haystack = `${summary.title ?? title} ${extract}`;
    const authorHint = nameAppearsInText(book.author, haystack);
    const mediumHint = book.medium ? nameAppearsInText(book.medium, haystack) : false;
    const xavierHint = nameAppearsInText("xavier", haystack);
    const bookHint =
      /\blivro\b|\bobra\b|\bpsicograf/i.test(extract) ||
      authorHint ||
      mediumHint ||
      xavierHint;
    // Evita páginas de conceito (ex.: "Desobsessão" como termo doutrinário)
    if (!bookHint) continue;

    const image = summary.originalimage?.source ?? summary.thumbnail?.source ?? "";
    results.push({
      title: summary.title ?? title,
      link: summary.content_urls?.desktop?.page ?? pageUrl,
      snippet: `${extract}${image ? ` Cover: ${image}` : ""}`.trim(),
      displayLink: "pt.wikipedia.org",
    });

    if (results.length >= 3) break;
  }

  return results;
}

export type DirectSearchProvider = {
  id: string;
  search: (book: BookEnrichmentInput) => Promise<CseSearchResult[]>;
};

let googleBooksDisabled = false;

export const DIRECT_SEARCH_PROVIDERS: DirectSearchProvider[] = [
  { id: "livrariaespirita", search: searchLivrariaEspirita },
  {
    id: "google-books",
    search: async (book) => {
      if (googleBooksDisabled) return [];
      try {
        return await searchGoogleBooks(book);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        const hint = googleBooksBlockedHint(message);
        if (hint || /blocked|accessNotConfigured|PERMISSION_DENIED/i.test(message)) {
          googleBooksDisabled = true;
          return [];
        }
        throw error;
      }
    },
  },
  { id: "openlibrary", search: searchOpenLibrary },
  { id: "wikipedia-pt", search: searchWikipediaPt },
];

/** Permite reativar após liberar a API no Console. */
export function resetGoogleBooksProvider(): void {
  googleBooksDisabled = false;
}

export async function searchDirectSources(
  book: BookEnrichmentInput,
  options?: {
    onProvider?: (providerId: string) => void;
    canRunProvider?: () => boolean;
  }
): Promise<{ results: CseSearchResult[]; providersUsed: string[] }> {
  const all: CseSearchResult[] = [];
  const providersUsed: string[] = [];
  const seen = new Set<string>();

  for (const provider of DIRECT_SEARCH_PROVIDERS) {
    if (provider.id === "google-books" && googleBooksDisabled) continue;
    if (options?.canRunProvider && !options.canRunProvider()) break;
    options?.onProvider?.(provider.id);
    providersUsed.push(provider.id);

    try {
      const found = await provider.search(book);
      for (const item of found) {
        const key = item.link.replace(/\/$/, "").toLowerCase();
        if (seen.has(key)) continue;
        seen.add(key);
        all.push(item);
      }
    } catch {
      // provedor individual não deve derrubar a obra
    }
  }

  all.sort((a, b) => getSourceTier(a.link) - getSourceTier(b.link));
  return { results: all, providersUsed };
}

/** Extrai URL de capa embutida em snippets sintéticos ("Cover: https://..."). */
export function extractEmbeddedCoverUrl(snippet: string): string | null {
  const match = /Cover:\s*(https?:\/\/\S+)/i.exec(snippet);
  return match?.[1]?.replace(/[),.;]+$/, "") ?? null;
}
