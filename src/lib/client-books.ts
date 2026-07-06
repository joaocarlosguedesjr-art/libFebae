export type BooksListResponse<T> = {
  items: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
};

/** Busca páginas do acervo até `maxPages` (protege o cliente de loops infinitos) */
export async function fetchBooksPages<T>(
  baseParams: URLSearchParams,
  options?: { maxPages?: number; pageSize?: number }
): Promise<{ items: T[]; total: number }> {
  const maxPages = options?.maxPages ?? 12;
  const pageSize = options?.pageSize ?? 100;

  const items: T[] = [];
  let total = 0;
  let page = 1;

  while (page <= maxPages) {
    const params = new URLSearchParams(baseParams);
    params.set("page", String(page));
    params.set("limit", String(pageSize));

    const res = await fetch(`/api/books?${params}`, { cache: "no-store" });
    if (!res.ok) {
      throw new Error(res.status === 429 ? "rate_limit" : "fetch_failed");
    }

    const data = (await res.json()) as BooksListResponse<T>;
    items.push(...data.items);
    total = data.total;

    if (!data.hasMore) break;
    page += 1;
  }

  return { items, total };
}
