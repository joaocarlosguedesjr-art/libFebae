import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma";

const STOPWORDS = new Set([
  "a", "o", "e", "de", "da", "do", "das", "dos", "em", "um", "uma", "uns", "umas",
  "para", "por", "com", "sem", "sob", "sobre", "que", "qual", "quais", "como",
  "eu", "me", "meu", "minha", "seu", "sua", "livro", "livros", "obra", "obras",
  "buscar", "quero", "preciso", "algum", "alguma", "recomende", "indique", "espirita",
  "espiritismo", "kardec", "medium", "mediunidade",
]);

/** Máximo de obras carregadas do banco antes do scoring em memória */
const CANDIDATE_POOL = 80;

export type BookMatch = {
  id: string;
  title: string;
  subtitle: string | null;
  author: string;
  medium: string | null;
  synopsis: string | null;
  collection: string | null;
  year: number | null;
  availableCopies: number;
  categories: string[];
  score: number;
  excerpt: string;
};

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .split(/[^a-z0-9]+/)
    .filter((w) => w.length >= 3 && !STOPWORDS.has(w));
}

function excerpt(text: string, terms: string[], max = 160): string {
  const lower = text.toLowerCase();
  const hit = terms.find((t) => lower.includes(t));
  if (!hit) return text.slice(0, max) + (text.length > max ? "…" : "");

  const idx = lower.indexOf(hit);
  const start = Math.max(0, idx - 40);
  const slice = text.slice(start, start + max);
  return (start > 0 ? "…" : "") + slice + (start + max < text.length ? "…" : "");
}

function scoreText(text: string | null | undefined, terms: string[]): number {
  if (!text) return 0;
  const lower = text.toLowerCase();
  return terms.reduce((acc, term) => (lower.includes(term) ? acc + 1 : acc), 0);
}

function buildCandidateWhere(terms: string[]): Prisma.BookWhereInput {
  return {
    OR: terms.flatMap((term) => [
      { title: { contains: term, mode: "insensitive" } },
      { subtitle: { contains: term, mode: "insensitive" } },
      { author: { contains: term, mode: "insensitive" } },
      { medium: { contains: term, mode: "insensitive" } },
      { synopsis: { contains: term, mode: "insensitive" } },
      { collection: { contains: term, mode: "insensitive" } },
      { publisher: { contains: term, mode: "insensitive" } },
      { notes: { contains: term, mode: "insensitive" } },
      { categories: { some: { name: { contains: term, mode: "insensitive" } } } },
    ]),
  };
}

export async function searchBooksBySynopsis(query: string, limit = 5): Promise<BookMatch[]> {
  const terms = tokenize(query);
  if (terms.length === 0) return [];

  const books = await prisma.book.findMany({
    where: buildCandidateWhere(terms),
    include: {
      copies: true,
      categories: true,
    },
    orderBy: { title: "asc" },
    take: CANDIDATE_POOL,
  });

  const scored = books
    .map((book) => {
      const synopsisScore = scoreText(book.synopsis, terms) * 4;
      const titleScore = scoreText(book.title, terms) * 3;
      const authorScore = scoreText(book.author, terms) * 3;
      const mediumScore = scoreText(book.medium, terms) * 3;
      const collectionScore = scoreText(book.collection, terms) * 2;
      const categoryScore = book.categories.reduce(
        (acc, c) => acc + scoreText(c.name, terms) * 2,
        0
      );
      const notesScore = scoreText(book.notes, terms);
      const publisherScore = scoreText(book.publisher, terms);

      const score =
        synopsisScore +
        titleScore +
        authorScore +
        mediumScore +
        collectionScore +
        categoryScore +
        notesScore +
        publisherScore;

      const synopsis = book.synopsis ?? "";
      const excerptText = synopsis
        ? excerpt(synopsis, terms)
        : `${book.title} — ${book.author}`;

      return {
        id: book.id,
        title: book.title,
        subtitle: book.subtitle,
        author: book.author,
        medium: book.medium,
        synopsis: book.synopsis,
        collection: book.collection,
        year: book.year,
        availableCopies: book.copies.filter((c) => c.status === "AVAILABLE").length,
        categories: book.categories.map((c) => c.name),
        score,
        excerpt: excerptText,
      };
    })
    .filter((b) => b.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return scored;
}

export function buildAssistantReply(query: string, matches: BookMatch[]): string {
  const trimmed = query.trim();

  if (!trimmed) {
    return "Olá! Sou o assistente da biblioteca espírita. Pergunte sobre temas, autores espirituais, médiuns ou obras — busco no acervo pelas sinopses e fichas catalográficas.";
  }

  if (matches.length === 0) {
    return `Não encontrei obras no acervo que combinem com "${trimmed}". Tente termos como codificação, romance espírita, médium, reencarnação ou o nome de um autor espiritual.`;
  }

  const intro =
    matches.length === 1
      ? "Encontrei 1 obra que pode interessar:"
      : `Encontrei ${matches.length} obras que podem interessar:`;

  const lines = matches.map((book, i) => {
    const avail =
      book.availableCopies > 0
        ? `${book.availableCopies} exemplar(es) disponível(is)`
        : "indisponível no momento";
    const cats = book.categories.length ? ` · ${book.categories.join(", ")}` : "";
    const medium = book.medium ? ` · Médium: ${book.medium}` : "";
    const collection = book.collection ? ` · Coleção: ${book.collection}` : "";
    return `${i + 1}. **${book.title}** — ${book.author}${medium}${cats}${collection}\n   ${book.excerpt}\n   (${avail})`;
  });

  return `${intro}\n\n${lines.join("\n\n")}\n\nPara retirar um exemplar, faça login ou procure o balcão da biblioteca.`;
}
