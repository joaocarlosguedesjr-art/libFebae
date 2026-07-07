import type { BookInput } from "@/lib/validations";

export function bookInputToPrismaData(parsed: BookInput) {
  const { categories, isbn, workType, year, pages, catalogNumber, authorGroup, workNumber, ...rest } = parsed;

  return {
    ...rest,
    workNumber: workNumber ?? null,
    catalogNumber: catalogNumber ?? null,
    authorGroup: authorGroup ?? null,
    isbn: isbn ?? null,
    workType: workType ?? null,
    year: year ?? null,
    pages: pages ?? null,
    subtitle: rest.subtitle ?? null,
    medium: rest.medium ?? null,
    publisher: rest.publisher ?? null,
    edition: rest.edition ?? null,
    collection: rest.collection ?? null,
    language: rest.language ?? null,
    synopsis: rest.synopsis ?? null,
    notes: rest.notes ?? null,
    coverImageUrl: rest.coverImageUrl ?? null,
    categories: categories?.length
      ? {
          connectOrCreate: categories.map((name) => ({
            where: { name },
            create: { name },
          })),
        }
      : undefined,
  };
}

export const BOOK_SEARCH_FIELDS = [
  "catalogNumber",
  "authorGroup",
  "title",
  "subtitle",
  "author",
  "medium",
  "isbn",
  "publisher",
  "edition",
  "collection",
  "synopsis",
  "notes",
  "language",
] as const;

export function buildBookSearchWhere(q: string) {
  return {
    OR: [
      { catalogNumber: { contains: q, mode: "insensitive" as const } },
      { authorGroup: { contains: q, mode: "insensitive" as const } },
      { title: { contains: q, mode: "insensitive" as const } },
      { subtitle: { contains: q, mode: "insensitive" as const } },
      { author: { contains: q, mode: "insensitive" as const } },
      { medium: { contains: q, mode: "insensitive" as const } },
      { isbn: { contains: q, mode: "insensitive" as const } },
      { publisher: { contains: q, mode: "insensitive" as const } },
      { edition: { contains: q, mode: "insensitive" as const } },
      { collection: { contains: q, mode: "insensitive" as const } },
      { synopsis: { contains: q, mode: "insensitive" as const } },
      { notes: { contains: q, mode: "insensitive" as const } },
      { language: { contains: q, mode: "insensitive" as const } },
      { categories: { some: { name: { contains: q, mode: "insensitive" as const } } } },
      { copies: { some: { code: { contains: q, mode: "insensitive" as const } } } },
    ],
  };
}

export const BOOK_PAGE_DEFAULT = 50;
export const BOOK_PAGE_CATALOG = 21;
export const BOOK_PAGE_MAX_PUBLIC = 100;
export const BOOK_PAGE_MAX_AUTH = 200;

export function parseBookPagination(
  searchParams: URLSearchParams,
  maxLimit: number
): { page: number; limit: number; skip: number } {
  const page = Math.max(1, Number.parseInt(searchParams.get("page") ?? "1", 10) || 1);
  const requested = Number.parseInt(searchParams.get("limit") ?? String(BOOK_PAGE_DEFAULT), 10);
  const limit = Math.min(maxLimit, Math.max(1, requested || BOOK_PAGE_DEFAULT));
  return { page, limit, skip: (page - 1) * limit };
}

export type PaginatedBooks<T> = {
  items: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
};
