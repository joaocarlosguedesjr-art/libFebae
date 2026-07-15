import type { SourceTier } from "./types";

const TIER1_HOSTS = [
  "livrariaespirita.org.br",
  "febnet.org.br",
  "febeditora.com.br",
  "ide.espirito.org.br",
  "editorafe.com.br",
];

const TIER2_HOSTS = [
  "openlibrary.org",
  "covers.openlibrary.org",
  "pt.wikipedia.org",
  "wikipedia.org",
  "upload.wikimedia.org",
  "livrariafeb.com.br",
  "amazon.com.br",
  "amazon.com",
  "mercadolivre.com.br",
  "livrariacultura.com.br",
  "saraiva.com.br",
  "martinsfontespaulista.com.br",
  "books.google.com",
  "books.google.com.br",
];

function hostMatches(hostname: string, patterns: string[]): boolean {
  const host = hostname.toLowerCase().replace(/^www\./, "");
  return patterns.some((pattern) => host === pattern || host.endsWith(`.${pattern}`));
}

export function getSourceTier(url: string): SourceTier {
  try {
    const hostname = new URL(url).hostname;
    if (hostMatches(hostname, TIER1_HOSTS)) return 1;
    if (hostMatches(hostname, TIER2_HOSTS)) return 2;
    return 3;
  } catch {
    return 3;
  }
}

export function tierBonus(tier: SourceTier): number {
  switch (tier) {
    case 1:
      return 20;
    case 2:
      return 10;
    default:
      return 0;
  }
}
