import { tierBonus } from "./source-tier";
import { nameAppearsInText, synopsesConflict, titleSimilarityScore } from "./text-utils";
import type { BookEnrichmentInput, EnrichmentSource, SourceTier } from "./types";
import {
  AUTO_APPLY_CONFIDENCE,
  REVIEW_CONFIDENCE_MIN,
  SNIPPET_MAX_CONFIDENCE,
  SYNOPSIS_MIN_LENGTH,
  TITLE_SIMILARITY_THRESHOLD,
} from "./types";

export type ScoreInput = {
  book: BookEnrichmentInput;
  url: string;
  tier: SourceTier;
  pageText: string;
  resultTitle: string;
  synopsis: string | null;
  coverImageUrl: string | null;
  fromSnippetOnly: boolean;
};

export function scoreSource(input: ScoreInput): EnrichmentSource {
  const { book } = input;
  const titleScore = Math.max(
    titleSimilarityScore(book.title, input.resultTitle),
    titleSimilarityScore(book.title, input.pageText)
  );

  const authorMatch =
    nameAppearsInText(book.author, input.pageText) ||
    (book.authorGroup ? nameAppearsInText(book.authorGroup, input.pageText) : false);

  const mediumMatch = book.medium
    ? nameAppearsInText(book.medium, input.pageText)
    : true;

  const titleComponent = titleScore * 0.4;
  const authorComponent = authorMatch ? 20 : 0;
  const mediumComponent = mediumMatch ? 20 : 0;
  const tierComponent = tierBonus(input.tier);

  let confidence = Math.round(
    titleComponent + authorComponent + mediumComponent + tierComponent
  );

  if (input.fromSnippetOnly) {
    confidence = Math.min(confidence, SNIPPET_MAX_CONFIDENCE);
  }

  if (titleScore < TITLE_SIMILARITY_THRESHOLD * 100) {
    confidence = Math.min(confidence, 55);
  }

  if (!authorMatch) {
    confidence = Math.min(confidence, 50);
  }

  if (book.medium && !mediumMatch) {
    confidence = Math.min(confidence, 55);
  }

  if (input.synopsis && input.synopsis.length < SYNOPSIS_MIN_LENGTH) {
    confidence = Math.min(confidence, 40);
  }

  confidence = Math.max(0, Math.min(100, confidence));

  return {
    url: input.url,
    tier: input.tier,
    synopsis: input.synopsis,
    coverImageUrl: input.coverImageUrl,
    titleScore,
    authorMatch,
    mediumMatch,
    confidence,
    fromSnippetOnly: input.fromSnippetOnly,
  };
}

export type ClassificationResult = {
  status: "auto_apply" | "needs_review" | "skipped" | "not_found";
  confidence: number;
  reason: string | null;
};

export function classifyEnrichment(
  sources: EnrichmentSource[],
  hasSynopsisCandidate: boolean,
  hasCoverCandidate: boolean
): ClassificationResult {
  if (sources.length === 0) {
    return {
      status: "not_found",
      confidence: 0,
      reason: "Nenhuma fonte relevante encontrada",
    };
  }

  const best = [...sources].sort((a, b) => b.confidence - a.confidence)[0]!;
  const tier1WithSynopsis = sources.filter((s) => s.tier === 1 && s.synopsis);

  if (tier1WithSynopsis.length >= 2) {
    const first = tier1WithSynopsis[0]!;
    const conflict = tier1WithSynopsis.some(
      (s) => s.url !== first.url && synopsesConflict(first.synopsis!, s.synopsis!)
    );
    if (conflict) {
      return {
        status: "needs_review",
        confidence: best.confidence,
        reason: "Sinopses conflitantes entre fontes oficiais (Tier 1)",
      };
    }
  }

  if (!hasSynopsisCandidate && !hasCoverCandidate) {
    return {
      status: "skipped",
      confidence: best.confidence,
      reason: "Nenhum campo pendente foi encontrado com confiança mínima",
    };
  }

  if (best.confidence >= AUTO_APPLY_CONFIDENCE && best.tier === 1) {
    return { status: "auto_apply", confidence: best.confidence, reason: null };
  }

  if (best.confidence >= REVIEW_CONFIDENCE_MIN || best.tier === 2) {
    return {
      status: "needs_review",
      confidence: best.confidence,
      reason:
        best.tier !== 1
          ? "Fonte não oficial (Tier 2 ou 3)"
          : "Confiança abaixo do limiar de aplicação automática",
    };
  }

  return {
    status: "skipped",
    confidence: best.confidence,
    reason: "Confiança insuficiente",
  };
}

export function pickBestField(
  sources: EnrichmentSource[],
  field: "synopsis" | "coverImageUrl",
  minConfidence = REVIEW_CONFIDENCE_MIN
): { value: string | null; source: EnrichmentSource | null } {
  const candidates = sources
    .filter((s) => {
      const value = field === "synopsis" ? s.synopsis : s.coverImageUrl;
      return value && s.confidence >= minConfidence;
    })
    .sort((a, b) => {
      if (a.tier !== b.tier) return a.tier - b.tier;
      return b.confidence - a.confidence;
    });

  const best = candidates[0];
  if (!best) return { value: null, source: null };

  return {
    value: field === "synopsis" ? best.synopsis : best.coverImageUrl,
    source: best,
  };
}
