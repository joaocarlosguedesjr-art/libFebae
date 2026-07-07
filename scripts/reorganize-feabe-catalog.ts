import fs from "node:fs";
import path from "node:path";
import {
  flattenFeabeCatalog,
  groupFeabeRows,
  summarizeFeabeCatalog,
  type FeabeSpreadsheetRow,
} from "../src/lib/catalog-feabe";

function parseCsvLine(line: string): string[] {
  const values: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (ch === ";" && !inQuotes) {
      values.push(current);
      current = "";
      continue;
    }
    current += ch;
  }
  values.push(current);
  return values;
}

export function loadRowsFromEnrichedCsv(csvPath: string): FeabeSpreadsheetRow[] {
  const raw = fs.readFileSync(csvPath, "utf8").replace(/^\uFEFF/, "");
  const lines = raw.split(/\r?\n/).filter(Boolean);
  const header = parseCsvLine(lines[0]);

  const idx = (name: string) => header.indexOf(name);
  const iLegacy = idx("numero_legado");
  const iShelf = idx("ordem_estante");
  const iTitle = idx("titulo");
  const iAuthor = idx("autor_espiritual");
  const iMedium = idx("medium");

  if ([iLegacy, iShelf, iTitle, iAuthor].some((i) => i < 0)) {
    throw new Error("CSV enriquecido com colunas inválidas.");
  }

  const rows: FeabeSpreadsheetRow[] = [];

  for (const line of lines.slice(1)) {
    const cols = parseCsvLine(line);
    const legacyNumber = Number(cols[iLegacy]);
    const shelfOrder = Number(cols[iShelf]);
    const title = cols[iTitle]?.trim() ?? "";
    const author = cols[iAuthor]?.trim() ?? "";
    const medium = cols[iMedium]?.trim() ?? "";

    if (!title || !author || Number.isNaN(legacyNumber)) continue;

    const authorRaw = medium ? `${medium} - ${author}` : author;
    rows.push({ legacyNumber, shelfOrder, title, authorRaw });
  }

  return rows;
}

export function writeEnrichedCatalog(
  groups: ReturnType<typeof groupFeabeRows>,
  outDir: string,
  sourceLabel: string
) {
  const flat = flattenFeabeCatalog(groups);
  const summary = summarizeFeabeCatalog(groups);
  fs.mkdirSync(outDir, { recursive: true });

  const csvHeader = [
    "numero_obra",
    "numero_exemplar",
    "numero_legado",
    "ordem_estante",
    "secao",
    "grupo_autor_espiritual",
    "codigo_autor",
    "titulo",
    "autor_espiritual",
    "medium",
    "tipo_obra",
    "colecao",
    "categorias",
    "idioma",
    "editora",
    "sinopse",
    "historico",
  ];

  const csvLines = [
    csvHeader.join(";"),
    ...flat.map((e) =>
      [
        e.workNumber,
        e.copyCode,
        e.legacyNumber,
        e.shelfOrder,
        e.section,
        e.authorGroup,
        e.authorCode,
        e.title,
        e.author,
        e.medium ?? "",
        e.workType,
        e.collection ?? "",
        e.categories.join(", "),
        e.language,
        e.publisher ?? "",
        (e.synopsis ?? "").replace(/;/g, ","),
        (e.notes ?? "").replace(/;/g, ","),
      ]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(";")
    ),
  ];

  const csvPath = path.join(outDir, "feabe-acervo-enriquecido.csv");
  fs.writeFileSync(csvPath, `\uFEFF${csvLines.join("\n")}`, "utf8");

  const summaryPath = path.join(outDir, "feabe-catalogo-resumo.json");
  fs.writeFileSync(
    summaryPath,
    JSON.stringify(
      {
        sourceFile: sourceLabel,
        generatedAt: new Date().toISOString(),
        ...summary,
      },
      null,
      2
    ),
    "utf8"
  );

  return { flat, summary, csvPath, summaryPath };
}

function main() {
  const csvPath = path.join(process.cwd(), "data", "feabe-acervo-enriquecido.csv");
  if (!fs.existsSync(csvPath)) {
    throw new Error(`Arquivo não encontrado: ${csvPath}`);
  }

  const rows = loadRowsFromEnrichedCsv(csvPath);
  const groups = groupFeabeRows(rows);
  const { summary, csvPath: outCsv } = writeEnrichedCatalog(
    groups,
    path.join(process.cwd(), "data"),
    path.basename(csvPath)
  );

  console.log("Acervo reorganizado: autor → espírito → obra");
  console.log("Obras únicas:", summary.uniqueWorks);
  console.log("Exemplares:", summary.totalCopies);
  console.log("Arquivo:", outCsv);
}

main();
