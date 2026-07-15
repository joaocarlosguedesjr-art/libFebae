import type { BookEnrichmentInput } from "./types";

function quote(value: string): string {
  return `"${value.replace(/"/g, "").trim()}"`;
}

/** Monta 2–4 queries Google BR por obra (título + autor + médium). */
export function buildEnrichmentQueries(book: BookEnrichmentInput): string[] {
  const title = book.title.trim();
  const author = book.author.trim();
  const medium = book.medium?.trim();
  const queries: string[] = [];

  if (medium) {
    queries.push(`${quote(title)} ${quote(author)} ${quote(medium)} sinopse`);
  } else {
    queries.push(`${quote(title)} ${quote(author)} sinopse`);
  }

  queries.push(
    `${quote(title)} ${author} site:febrasil.org.br OR site:ide.espirito.org.br`
  );
  queries.push(`${quote(title)} ${author} capa livro`);

  if (medium) {
    queries.push(`${quote(title)} ${medium} psicografia`);
  }

  return [...new Set(queries)];
}
