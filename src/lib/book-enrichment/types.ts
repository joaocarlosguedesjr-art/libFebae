export type EnrichmentStatus =
  | "auto_apply"
  | "needs_review"
  | "skipped"
  | "not_found"
  | "pending";

export type SourceTier = 1 | 2 | 3;

export type BookEnrichmentInput = {
  id: string;
  workNumber: number;
  title: string;
  author: string;
  medium: string | null;
  authorGroup: string | null;
  synopsis: string | null;
  coverImageUrl: string | null;
};

export type CseSearchResult = {
  title: string;
  link: string;
  snippet: string;
  displayLink: string;
};

export type ExtractedPageMetadata = {
  url: string;
  tier: SourceTier;
  synopsis: string | null;
  coverImageUrl: string | null;
  pageText: string;
  fetchError: string | null;
};

export type EnrichmentSource = {
  url: string;
  tier: SourceTier;
  synopsis: string | null;
  coverImageUrl: string | null;
  titleScore: number;
  authorMatch: boolean;
  mediumMatch: boolean;
  confidence: number;
  fromSnippetOnly: boolean;
};

export type EnrichmentResult = {
  workNumber: number;
  bookId: string;
  title: string;
  author: string;
  medium: string | null;
  status: EnrichmentStatus;
  synopsis: string | null;
  coverImageUrl: string | null;
  confidence: number;
  sources: EnrichmentSource[];
  queries: string[];
  reason: string | null;
  researchedAt: string;
  needsSynopsis: boolean;
  needsCover: boolean;
};

export type EnrichmentState = {
  version: 2;
  startedAt: string;
  updatedAt: string;
  processedWorkNumbers: number[];
  queryCount: number;
  lastWorkNumber: number | null;
  dailyQuota: {
    date: string;
    booksProcessed: number;
    queriesUsed: number;
  };
};

export type EnrichmentReport = {
  generatedAt: string;
  totalBooks: number;
  researched: number;
  autoApply: number;
  needsReview: number;
  skipped: number;
  notFound: number;
  synopsisFound: number;
  coverFound: number;
  queryCount: number;
};

export const SYNOPSIS_MIN_LENGTH = 80;
export const SYNOPSIS_MAX_LENGTH = 2000;
export const TITLE_SIMILARITY_THRESHOLD = 0.85;
export const AUTO_APPLY_CONFIDENCE = 80;
export const REVIEW_CONFIDENCE_MIN = 60;
export const SNIPPET_MAX_CONFIDENCE = 70;

/** Máximo de livros pesquisados por dia (controle de custo). */
export const DAILY_BOOK_LIMIT = Number(process.env.BOOK_ENRICHMENT_DAILY_BOOK_LIMIT ?? 80);

/** Cota gratuita do Google Custom Search JSON API (100 buscas/dia). */
export const DAILY_QUERY_LIMIT = Number(process.env.BOOK_ENRICHMENT_DAILY_QUERY_LIMIT ?? 100);
