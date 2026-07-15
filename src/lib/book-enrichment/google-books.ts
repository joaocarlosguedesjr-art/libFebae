import type { BookEnrichmentInput, CseSearchResult } from "./types";
import {
  nameAppearsInText,
  normalizeText,
  titleSimilarityScore,
} from "./text-utils";
import { TITLE_SIMILARITY_THRESHOLD } from "./types";

type GoogleBooksVolume = {
  volumeInfo?: {
    title?: string;
    subtitle?: string;
    authors?: string[];
    description?: string;
    infoLink?: string;
    canonicalVolumeLink?: string;
    imageLinks?: {
      thumbnail?: string;
      smallThumbnail?: string;
      small?: string;
      medium?: string;
      large?: string;
    };
    industryIdentifiers?: Array<{ type?: string; identifier?: string }>;
  };
};

type GoogleBooksResponse = {
  items?: GoogleBooksVolume[];
  error?: { message?: string };
};

function toHttps(url: string | undefined): string | null {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    if (parsed.protocol === "http:") parsed.protocol = "https:";
    return parsed.href;
  } catch {
    return null;
  }
}

/**
 * Google Books API (GCP).
 * Requer: API ativada + chave com "Books API" liberada nas restrições.
 * Endpoint: https://www.googleapis.com/books/v1/volumes
 */
export async function searchGoogleBooks(
  book: BookEnrichmentInput
): Promise<CseSearchResult[]> {
  const apiKey = process.env.GOOGLE_CSE_API_KEY?.trim();
  if (!apiKey) return [];

  const parts = [
    `intitle:"${book.title.replace(/"/g, "")}"`,
    book.author ? `inauthor:"${book.author.replace(/"/g, "")}"` : "",
    book.medium?.includes("Xavier") ? "Xavier" : book.medium ?? "",
  ].filter(Boolean);

  const url =
    "https://www.googleapis.com/books/v1/volumes?" +
    new URLSearchParams({
      q: parts.join(" "),
      maxResults: "5",
      langRestrict: "pt",
      printType: "books",
      key: apiKey,
    }).toString();

  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      "User-Agent": "BibliotecaFEABE-Enrichment/1.0",
    },
  });
  const data = (await response.json()) as GoogleBooksResponse;
  if (!response.ok) {
    throw new Error(data.error?.message ?? `Google Books HTTP ${response.status}`);
  }

  const results: CseSearchResult[] = [];
  for (const item of data.items ?? []) {
    const info = item.volumeInfo;
    if (!info?.title) continue;

    const authors = (info.authors ?? []).join(" ");
    const haystack = `${info.title} ${info.subtitle ?? ""} ${authors} ${info.description ?? ""}`;
    const titleOk =
      titleSimilarityScore(book.title, info.title) >= TITLE_SIMILARITY_THRESHOLD * 100;
    const authorOk =
      nameAppearsInText(book.author, haystack) ||
      (book.authorGroup ? nameAppearsInText(book.authorGroup, haystack) : false) ||
      (book.medium ? nameAppearsInText(book.medium, haystack) : false);
    if (!titleOk || !authorOk) continue;

    const cover =
      toHttps(info.imageLinks?.large) ??
      toHttps(info.imageLinks?.medium) ??
      toHttps(info.imageLinks?.thumbnail) ??
      toHttps(info.imageLinks?.smallThumbnail);

    const link =
      info.infoLink ??
      info.canonicalVolumeLink ??
      `https://books.google.com/books?q=${encodeURIComponent(info.title)}`;

    results.push({
      title: info.title,
      link,
      snippet: `${info.description ?? ""}${cover ? ` Cover: ${cover}` : ""}`.trim(),
      displayLink: "books.google.com",
    });
  }

  return results;
}

export function isGoogleBooksConfigured(): boolean {
  return Boolean(process.env.GOOGLE_CSE_API_KEY?.trim());
}

export function googleBooksBlockedHint(message: string): string | null {
  const lower = message.toLowerCase();
  if (!lower.includes("books") && !lower.includes("api_key_service_blocked")) {
    return null;
  }
  return (
    "Google Books bloqueado na chave. Ative books.googleapis.com e liberar " +
    '"Books API" nas restrições da API Key (ou "Não restringir a chave").'
  );
}

export function buildGoogleBooksQuery(book: BookEnrichmentInput): string {
  return normalizeText(`${book.title} ${book.author} ${book.medium ?? ""}`);
}
