import type { EnrichmentState } from "./types";
import { DAILY_BOOK_LIMIT, DAILY_QUERY_LIMIT } from "./types";

/** Data local Brasil (YYYY-MM-DD) para reset diário da cota. */
export function getTodayDateBr(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
  }).format(new Date());
}

export function createDailyQuota(date = getTodayDateBr()) {
  return { date, booksProcessed: 0, queriesUsed: 0 };
}

/** Garante estado diário; zera contadores quando muda o dia. */
export function syncDailyQuota(state: EnrichmentState): void {
  if (!state.dailyQuota || state.dailyQuota.date !== getTodayDateBr()) {
    state.dailyQuota = createDailyQuota();
  }
}

export type DailyQuotaStatus = {
  date: string;
  booksProcessed: number;
  booksRemaining: number;
  queriesUsed: number;
  queriesRemaining: number;
  bookLimitReached: boolean;
  queryLimitReached: boolean;
};

export function getDailyQuotaStatus(state: EnrichmentState): DailyQuotaStatus {
  syncDailyQuota(state);
  const { booksProcessed, queriesUsed } = state.dailyQuota;
  const booksRemaining = Math.max(0, DAILY_BOOK_LIMIT - booksProcessed);
  const queriesRemaining = Math.max(0, DAILY_QUERY_LIMIT - queriesUsed);

  return {
    date: state.dailyQuota.date,
    booksProcessed,
    booksRemaining,
    queriesUsed,
    queriesRemaining,
    bookLimitReached: booksProcessed >= DAILY_BOOK_LIMIT,
    queryLimitReached: queriesUsed >= DAILY_QUERY_LIMIT,
  };
}

export function canStartAnotherBook(state: EnrichmentState): boolean {
  const status = getDailyQuotaStatus(state);
  return !status.bookLimitReached && !status.queryLimitReached;
}

export function canRunAnotherQuery(state: EnrichmentState): boolean {
  syncDailyQuota(state);
  return state.dailyQuota.queriesUsed < DAILY_QUERY_LIMIT;
}

export function recordBookProcessed(state: EnrichmentState): void {
  syncDailyQuota(state);
  state.dailyQuota.booksProcessed += 1;
}

export function recordQueryUsed(state: EnrichmentState): void {
  syncDailyQuota(state);
  state.dailyQuota.queriesUsed += 1;
  state.queryCount += 1;
}

export function dailyLimitStopReason(state: EnrichmentState): string | null {
  const status = getDailyQuotaStatus(state);
  if (status.bookLimitReached) {
    return `Limite diário de ${DAILY_BOOK_LIMIT} livros atingido. Execute amanhã com --resume.`;
  }
  if (status.queryLimitReached) {
    return `Limite diário de ${DAILY_QUERY_LIMIT} buscas na API Google atingido (cota gratuita). Execute amanhã com --resume.`;
  }
  return null;
}

export function migrateState(state: EnrichmentState): EnrichmentState {
  if (!state.dailyQuota) {
    return {
      ...state,
      version: 2,
      dailyQuota: createDailyQuota(),
    };
  }
  return { ...state, version: 2 };
}
