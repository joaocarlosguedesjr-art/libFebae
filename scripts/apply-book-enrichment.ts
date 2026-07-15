import { PrismaClient } from "../src/generated/prisma";
import {
  appendProvenance,
  loadResults,
  type EnrichmentResult,
} from "../src/lib/book-enrichment";
import { sanitizeCoverImageUrl } from "../src/lib/safe-image-url";

const prisma = new PrismaClient();
const BATCH_SIZE = 50;

type CliOptions = {
  dryRun: boolean;
  workNumber: number | null;
};

function parseArgs(argv: string[]): CliOptions {
  return {
    dryRun: argv.includes("--dry-run"),
    workNumber: (() => {
      const idx = argv.indexOf("--work-number");
      if (idx >= 0 && argv[idx + 1]) return Number(argv[idx + 1]);
      return null;
    })(),
  };
}

function log(message: string): void {
  const ts = new Date().toISOString().slice(11, 19);
  console.log(`[${ts}] ${message}`);
}

function sourceUrls(result: EnrichmentResult): string[] {
  return result.sources
    .filter((s) => s.synopsis || s.coverImageUrl)
    .slice(0, 3)
    .map((s) => s.url);
}

async function applyResult(result: EnrichmentResult, dryRun: boolean): Promise<boolean> {
  if (result.status !== "auto_apply") return false;

  const book = await prisma.book.findFirst({
    where: { workNumber: result.workNumber },
    select: {
      id: true,
      synopsis: true,
      coverImageUrl: true,
      notes: true,
    },
  });

  if (!book) {
    log(`  Obra #${result.workNumber} não encontrada no banco`);
    return false;
  }

  const data: {
    synopsis?: string;
    coverImageUrl?: string;
    notes?: string;
  } = {};

  if (!book.synopsis?.trim() && result.synopsis) {
    data.synopsis = result.synopsis;
  }

  const cover = sanitizeCoverImageUrl(result.coverImageUrl);
  if (!book.coverImageUrl?.trim() && cover) {
    data.coverImageUrl = cover;
  }

  if (Object.keys(data).length === 0) {
    log(`  #${result.workNumber}: nada a aplicar (campos já preenchidos)`);
    return false;
  }

  const urls = sourceUrls(result);
  if (urls.length > 0) {
    data.notes = appendProvenance(book.notes, urls);
  }

  if (dryRun) {
    log(`  [dry-run] #${result.workNumber}: ${JSON.stringify(data)}`);
    return true;
  }

  await prisma.book.update({
    where: { id: book.id },
    data,
  });

  log(`  #${result.workNumber}: aplicado (${Object.keys(data).join(", ")})`);
  return true;
}

async function main(): Promise<void> {
  const options = parseArgs(process.argv.slice(2));
  const results = loadResults();
  let candidates = Object.values(results).filter((r) => r.status === "auto_apply");

  if (options.workNumber != null) {
    candidates = candidates.filter((r) => r.workNumber === options.workNumber);
  }

  if (candidates.length === 0) {
    log("Nenhum resultado com status auto_apply encontrado em data/book-enrichment-results.json");
    return;
  }

  log(
    `${options.dryRun ? "[dry-run] " : ""}Aplicando ${candidates.length} obra(s) com alta confiança`
  );

  let applied = 0;
  for (let i = 0; i < candidates.length; i += BATCH_SIZE) {
    const batch = candidates.slice(i, i + BATCH_SIZE);
    for (const result of batch) {
      const ok = await applyResult(result, options.dryRun);
      if (ok) applied++;
    }
  }

  log(`Finalizado: ${applied} obra(s) ${options.dryRun ? "seriam aplicadas" : "aplicadas"}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
