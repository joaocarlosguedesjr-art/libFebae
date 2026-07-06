import fs from "node:fs";
import path from "node:path";
import XLSX from "xlsx";
import {
  flattenFeabeCatalog,
  groupFeabeRows,
  summarizeFeabeCatalog,
  type FeabeSpreadsheetRow,
} from "../src/lib/catalog-feabe";

function findSpreadsheet(): string {
  const root = process.cwd();
  const file = fs.readdirSync(root).find((f) => f.includes("LIVROS_FEABE") && f.endsWith(".xlsx"));
  if (!file) {
    throw new Error("Planilha LIVROS_FEABE*.xlsx não encontrada na raiz do projeto.");
  }
  return path.join(root, file);
}

function parseSheet(
  wb: XLSX.WorkBook,
  sheetName: string
): Map<string, FeabeSpreadsheetRow> {
  const data = XLSX.utils.sheet_to_json(wb.Sheets[sheetName], {
    header: 1,
    defval: "",
  }) as Array<[number | string, string, string]>;

  const map = new Map<string, FeabeSpreadsheetRow>();

  for (const row of data.slice(1)) {
    const title = String(row[1] ?? "").trim();
    const authorRaw = String(row[2] ?? "").trim();
    const legacyNumber = Number(row[0]);
    if (!title || !authorRaw || Number.isNaN(legacyNumber)) continue;

    const key = `${title.toLowerCase()}|${authorRaw.toLowerCase()}|${legacyNumber}`;
    map.set(key, { legacyNumber, shelfOrder: legacyNumber, title, authorRaw });
  }

  return map;
}

function normalizeKey(title: string, authorRaw: string) {
  return `${title.trim().toLowerCase()}|${authorRaw.trim().toLowerCase()}`;
}

function main() {
  const file = findSpreadsheet();
  const wb = XLSX.readFile(file);

  const table1 = parseSheet(wb, "Table 1");
  const table2Rows = XLSX.utils.sheet_to_json(wb.Sheets["Table 2"], {
    header: 1,
    defval: "",
  }) as Array<[number | string, string, string]>;

  const shelfByTitleAuthor = new Map<string, number>();
  for (const row of table2Rows.slice(1)) {
    const title = String(row[1] ?? "").trim();
    const authorRaw = String(row[2] ?? "").trim();
    const shelfOrder = Number(row[0]);
    if (!title || !authorRaw || Number.isNaN(shelfOrder)) continue;
    shelfByTitleAuthor.set(normalizeKey(title, authorRaw), shelfOrder);
  }

  const rows: FeabeSpreadsheetRow[] = [];

  for (const item of table1.values()) {
    const shelfOrder =
      shelfByTitleAuthor.get(normalizeKey(item.title, item.authorRaw)) ?? item.legacyNumber;
    rows.push({ ...item, shelfOrder });
  }

  const groups = groupFeabeRows(rows);
  const flat = flattenFeabeCatalog(groups);
  const summary = summarizeFeabeCatalog(groups);

  const outDir = path.join(process.cwd(), "data");
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

  const xlsxOut = flat.map((e) => ({
    "Nº obra": e.workNumber,
    "Nº exemplar": e.copyCode,
    "Nº legado (Table 1)": e.legacyNumber,
    "Ordem estante (Table 2)": e.shelfOrder,
    Seção: e.section,
    "Grupo autor / espírito": e.authorGroup,
    "Autor espiritual": e.author,
    Médium: e.medium ?? "",
    Título: e.title,
    "Tipo obra": e.workType,
    Coleção: e.collection ?? "",
    Categorias: e.categories.join(", "),
    Idioma: e.language,
    Editora: e.publisher ?? "",
    Sinopse: e.synopsis ?? "",
    Histórico: e.notes ?? "",
  }));

  const wbOut = XLSX.utils.book_new();
  const wsOut = XLSX.utils.json_to_sheet(xlsxOut);
  XLSX.utils.book_append_sheet(wbOut, wsOut, "Acervo FEABE");
  const xlsxPath = path.join(outDir, "feabe-acervo-enriquecido.xlsx");
  XLSX.writeFile(wbOut, xlsxPath);

  const summaryPath = path.join(outDir, "feabe-catalogo-resumo.json");
  fs.writeFileSync(
    summaryPath,
    JSON.stringify(
      {
        sourceFile: path.basename(file),
        generatedAt: new Date().toISOString(),
        ...summary,
      },
      null,
      2
    ),
    "utf8"
  );

  console.log("Planilha origem:", path.basename(file));
  console.log("Obras únicas:", summary.uniqueWorks);
  console.log("Exemplares físicos:", summary.totalCopies);
  console.log("Por seção:", summary.bySection);
  console.log("Top autores:", summary.topAuthors);
  console.log("\nArquivos gerados:");
  console.log(" ", csvPath);
  console.log(" ", xlsxPath);
  console.log(" ", summaryPath);
}

main();
