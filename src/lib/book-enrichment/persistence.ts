import fs from "node:fs";
import path from "node:path";
import type {
  EnrichmentReport,
  EnrichmentResult,
  EnrichmentState,
} from "./types";
import { createDailyQuota, migrateState } from "./daily-quota";

export const DATA_DIR = path.join(process.cwd(), "data");
export const STATE_PATH = path.join(DATA_DIR, "book-enrichment-state.json");
export const RESULTS_PATH = path.join(DATA_DIR, "book-enrichment-results.json");
export const REVIEW_CSV_PATH = path.join(DATA_DIR, "book-enrichment-review.csv");
export const REPORT_PATH = path.join(DATA_DIR, "book-enrichment-report.json");

function ensureDataDir(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

export function loadState(): EnrichmentState | null {
  if (!fs.existsSync(STATE_PATH)) return null;
  const raw = JSON.parse(fs.readFileSync(STATE_PATH, "utf8")) as EnrichmentState;
  return migrateState(raw);
}

export function saveState(state: EnrichmentState): void {
  ensureDataDir();
  fs.writeFileSync(STATE_PATH, JSON.stringify(state, null, 2), "utf8");
}

export function loadResults(): Record<string, EnrichmentResult> {
  if (!fs.existsSync(RESULTS_PATH)) return {};
  return JSON.parse(fs.readFileSync(RESULTS_PATH, "utf8")) as Record<
    string,
    EnrichmentResult
  >;
}

export function saveResults(results: Record<string, EnrichmentResult>): void {
  ensureDataDir();
  fs.writeFileSync(RESULTS_PATH, JSON.stringify(results, null, 2), "utf8");
}

export function appendReviewCsvRow(result: EnrichmentResult): void {
  ensureDataDir();
  const header =
    "workNumber;bookId;title;author;medium;status;confidence;synopsis;coverImageUrl;sources;reason\n";
  const sources = result.sources
    .slice(0, 3)
    .map((s) => s.url)
    .join(" | ");

  const row = [
    result.workNumber,
    result.bookId,
    csvEscape(result.title),
    csvEscape(result.author),
    csvEscape(result.medium ?? ""),
    result.status,
    result.confidence,
    csvEscape(result.synopsis ?? ""),
    csvEscape(result.coverImageUrl ?? ""),
    csvEscape(sources),
    csvEscape(result.reason ?? ""),
  ].join(";");

  if (!fs.existsSync(REVIEW_CSV_PATH)) {
    fs.writeFileSync(REVIEW_CSV_PATH, header, "utf8");
  }
  fs.appendFileSync(REVIEW_CSV_PATH, `${row}\n`, "utf8");
}

function csvEscape(value: string): string {
  if (value.includes(";") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function writeReport(report: EnrichmentReport): void {
  ensureDataDir();
  fs.writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2), "utf8");
}

export function buildReport(results: Record<string, EnrichmentResult>): EnrichmentReport {
  const values = Object.values(results);
  return {
    generatedAt: new Date().toISOString(),
    totalBooks: values.length,
    researched: values.length,
    autoApply: values.filter((r) => r.status === "auto_apply").length,
    needsReview: values.filter((r) => r.status === "needs_review").length,
    skipped: values.filter((r) => r.status === "skipped").length,
    notFound: values.filter((r) => r.status === "not_found").length,
    synopsisFound: values.filter((r) => r.synopsis).length,
    coverFound: values.filter((r) => r.coverImageUrl).length,
    queryCount: 0,
  };
}

export function appendProvenance(
  existingNotes: string | null | undefined,
  sourceUrls: string[]
): string {
  const date = new Date().toISOString().slice(0, 10);
  const provenance = `Enriquecido em ${date} via ${sourceUrls.join(", ")}`;
  if (!existingNotes?.trim()) return provenance;
  if (existingNotes.includes(provenance)) return existingNotes;
  return `${existingNotes} · ${provenance}`;
}
