import { config } from "dotenv";
import { enrichWork } from "../src/lib/book-enrichment/enrich-work";
import { searchDirectSources } from "../src/lib/book-enrichment/direct-search";
import type { BookEnrichmentInput } from "../src/lib/book-enrichment/types";

config({ override: true });

const book: BookEnrichmentInput = {
  id: "dbg",
  workNumber: 9,
  title: "Desobsessão",
  author: "André Luiz",
  medium: "Francisco Cândido Xavier",
  authorGroup: "André Luiz",
  synopsis: null,
  coverImageUrl: null,
};

async function main() {
  const direct = await searchDirectSources(book);
  console.log("providersUsed", direct.providersUsed);
  console.log(
    "results",
    direct.results.map((r) => ({
      title: r.title,
      link: r.link,
      snippet: r.snippet.slice(0, 140),
      displayLink: r.displayLink,
    }))
  );

  const enriched = await enrichWork(book, { cse: null, preferDirect: true });
  console.log("\nenrichment", {
    status: enriched.status,
    confidence: enriched.confidence,
    synopsis: enriched.synopsis?.slice(0, 160),
    cover: enriched.coverImageUrl,
    sources: enriched.sources.map((s) => ({
      url: s.url,
      conf: s.confidence,
      tier: s.tier,
      titleScore: s.titleScore,
      author: s.authorMatch,
      medium: s.mediumMatch,
      hasSyn: Boolean(s.synopsis),
      hasCover: Boolean(s.coverImageUrl),
    })),
    reason: enriched.reason,
  });
}

main().catch(console.error);
