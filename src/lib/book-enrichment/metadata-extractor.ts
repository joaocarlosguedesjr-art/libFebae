import { isSafeExternalImageUrl } from "@/lib/safe-image-url";
import { getSourceTier } from "./source-tier";
import {
  cleanExtractedSynopsis,
  isGenericShopSynopsis,
} from "./text-utils";
import type { ExtractedPageMetadata } from "./types";
import { SYNOPSIS_MAX_LENGTH, SYNOPSIS_MIN_LENGTH } from "./types";

function decodeHtmlEntities(value: string): string {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ");
}

function extractMetaContent(html: string, attr: string, key: string): string | null {
  const patterns = [
    new RegExp(
      `<meta[^>]+${attr}=["']${key}["'][^>]+content=["']([^"']+)["']`,
      "i"
    ),
    new RegExp(
      `<meta[^>]+content=["']([^"']+)["'][^>]+${attr}=["']${key}["']`,
      "i"
    ),
  ];

  for (const pattern of patterns) {
    const match = pattern.exec(html);
    if (match?.[1]) return decodeHtmlEntities(match[1].trim());
  }
  return null;
}

function extractTitle(html: string): string | null {
  const match = /<title[^>]*>([^<]+)<\/title>/i.exec(html);
  return match?.[1] ? decodeHtmlEntities(match[1].trim()) : null;
}

function stripHtmlTags(value: string): string {
  return decodeHtmlEntities(value.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim());
}

function extractJsonLdBlocks(html: string): unknown[] {
  const blocks: unknown[] = [];
  const pattern =
    /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(html)) !== null) {
    try {
      blocks.push(JSON.parse(match[1]!));
    } catch {
      // ignora JSON-LD inválido
    }
  }
  return blocks;
}

function collectJsonLdNodes(node: unknown, acc: Record<string, unknown>[]): void {
  if (!node) return;
  if (Array.isArray(node)) {
    for (const item of node) collectJsonLdNodes(item, acc);
    return;
  }
  if (typeof node !== "object") return;

  const record = node as Record<string, unknown>;
  acc.push(record);

  if (record["@graph"]) collectJsonLdNodes(record["@graph"], acc);
}

function isBookType(typeValue: unknown): boolean {
  if (typeof typeValue === "string") {
    return typeValue.toLowerCase().includes("book");
  }
  if (Array.isArray(typeValue)) {
    return typeValue.some((t) => typeof t === "string" && t.toLowerCase().includes("book"));
  }
  return false;
}

function extractFromJsonLd(html: string): { synopsis: string | null; cover: string | null } {
  const blocks = extractJsonLdBlocks(html);
  const nodes: Record<string, unknown>[] = [];
  for (const block of blocks) collectJsonLdNodes(block, nodes);

  for (const node of nodes) {
    if (!isBookType(node["@type"])) continue;

    const description =
      typeof node.description === "string" ? node.description : null;
    const image = node.image;
    let cover: string | null = null;

    if (typeof image === "string") cover = image;
    else if (Array.isArray(image) && typeof image[0] === "string") cover = image[0];
    else if (image && typeof image === "object" && typeof (image as { url?: string }).url === "string") {
      cover = (image as { url: string }).url;
    }

    if (description || cover) {
      return { synopsis: description, cover };
    }
  }

  return { synopsis: null, cover: null };
}

function extractSynopsisFromBody(html: string): string | null {
  const sectionPatterns = [
    /<(?:div|section|p)[^>]*class=["'][^"']*(?:sinopse|resumo|description|descricao)[^"']*["'][^>]*>([\s\S]*?)<\/(?:div|section|p)>/gi,
    /<h[23][^>]*>\s*(?:Sinopse|Resumo|Apresentação)\s*<\/h[23]>\s*<p[^>]*>([\s\S]*?)<\/p>/gi,
  ];

  for (const pattern of sectionPatterns) {
    const match = pattern.exec(html);
    if (match?.[1]) {
      const text = stripHtmlTags(match[1]);
      if (text.length >= SYNOPSIS_MIN_LENGTH) return text;
    }
  }

  return null;
}

function normalizeCoverUrl(raw: string | null, pageUrl: string): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;

  try {
    const absolute = trimmed.startsWith("//")
      ? new URL(`https:${trimmed}`)
      : new URL(trimmed, pageUrl);
    if (absolute.protocol === "http:") {
      absolute.protocol = "https:";
    }
    const href = absolute.href;
    return isSafeExternalImageUrl(href) ? href : null;
  } catch {
    return null;
  }
}

function acceptSynopsis(value: string | null): string | null {
  if (!value) return null;
  const cleaned = cleanExtractedSynopsis(value);
  if (cleaned.length < SYNOPSIS_MIN_LENGTH) return null;
  if (isGenericShopSynopsis(cleaned)) return null;
  if (cleaned.length > SYNOPSIS_MAX_LENGTH) {
    return cleaned.slice(0, SYNOPSIS_MAX_LENGTH).trim();
  }
  return cleaned;
}

function extractProductImage(html: string): string | null {
  const patterns = [
    /(?:data-zoom-image|data-src)=["']([^"']+\/media\/catalog\/product\/[^"']+\.(?:jpg|jpeg|png|webp)[^"']*)["']/i,
    /src=["']([^"']+\/media\/catalog\/product\/cache\/[^"']+\/(?:image|thumbnail)\/[^"']+\.(?:jpg|jpeg|png|webp)[^"']*)["']/i,
    /src=["']([^"']+\/media\/catalog\/product\/[^"']+\.(?:jpg|jpeg|png|webp)[^"']*)["']/i,
  ];
  for (const pattern of patterns) {
    const match = pattern.exec(html);
    if (match?.[1] && !match[1].includes("placeholder")) return match[1];
  }
  return null;
}

export function extractPageMetadata(url: string, html: string): ExtractedPageMetadata {
  const tier = getSourceTier(url);

  const ogDescription = extractMetaContent(html, "property", "og:description");
  const metaDescription = extractMetaContent(html, "name", "description");
  const twitterDescription = extractMetaContent(html, "name", "twitter:description");

  const ogImage = extractMetaContent(html, "property", "og:image");
  const twitterImage = extractMetaContent(html, "name", "twitter:image");
  const productImage = extractProductImage(html);

  const jsonLd = extractFromJsonLd(html);
  const bodySynopsis = extractSynopsisFromBody(html);

  const synopsis =
    acceptSynopsis(jsonLd.synopsis) ??
    acceptSynopsis(ogDescription) ??
    acceptSynopsis(bodySynopsis) ??
    acceptSynopsis(metaDescription) ??
    acceptSynopsis(twitterDescription);

  const coverImageUrl =
    normalizeCoverUrl(jsonLd.cover, url) ??
    normalizeCoverUrl(ogImage, url) ??
    normalizeCoverUrl(twitterImage, url) ??
    normalizeCoverUrl(productImage, url);

  const pageTitle = extractTitle(html) ?? "";
  const visibleText = stripHtmlTags(
    html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
  );

  const pageText = `${pageTitle} ${visibleText}`.slice(0, 8000);

  return {
    url,
    tier,
    synopsis,
    coverImageUrl,
    pageText,
    fetchError: null,
  };
}

export function extractFromSnippet(
  url: string,
  snippet: string,
  resultTitle: string
): ExtractedPageMetadata {
  const tier = getSourceTier(url);
  const synopsis = acceptSynopsis(snippet);
  const pageText = `${resultTitle} ${snippet}`;

  return {
    url,
    tier,
    synopsis,
    coverImageUrl: null,
    pageText,
    fetchError: null,
  };
}
