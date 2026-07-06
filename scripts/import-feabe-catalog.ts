import fs from "node:fs";
import path from "node:path";
import XLSX from "xlsx";
import { PrismaClient } from "../src/generated/prisma";
import {
  groupFeabeRows,
  type FeabeSpreadsheetRow,
} from "../src/lib/catalog-feabe";

const prisma = new PrismaClient();

function findSpreadsheet(): string {
  const root = process.cwd();
  const file = fs.readdirSync(root).find((f) => f.includes("LIVROS_FEABE") && f.endsWith(".xlsx"));
  if (!file) throw new Error("Planilha LIVROS_FEABE*.xlsx não encontrada.");
  return path.join(root, file);
}

function loadRows(): FeabeSpreadsheetRow[] {
  const file = findSpreadsheet();
  const wb = XLSX.readFile(file);

  const table1 = XLSX.utils.sheet_to_json(wb.Sheets["Table 1"], {
    header: 1,
    defval: "",
  }) as Array<[number | string, string, string]>;

  const table2 = XLSX.utils.sheet_to_json(wb.Sheets["Table 2"], {
    header: 1,
    defval: "",
  }) as Array<[number | string, string, string]>;

  const shelfMap = new Map<string, number>();
  for (const row of table2.slice(1)) {
    const title = String(row[1] ?? "").trim();
    const authorRaw = String(row[2] ?? "").trim();
    const shelfOrder = Number(row[0]);
    if (!title || !authorRaw || Number.isNaN(shelfOrder)) continue;
    shelfMap.set(`${title.toLowerCase()}|${authorRaw.toLowerCase()}`, shelfOrder);
  }

  return table1
    .slice(1)
    .map((row) => {
      const title = String(row[1] ?? "").trim();
      const authorRaw = String(row[2] ?? "").trim();
      const legacyNumber = Number(row[0]);
      if (!title || !authorRaw || Number.isNaN(legacyNumber)) return null;

      const shelfOrder =
        shelfMap.get(`${title.toLowerCase()}|${authorRaw.toLowerCase()}`) ?? legacyNumber;

      return { legacyNumber, shelfOrder, title, authorRaw };
    })
    .filter((row): row is FeabeSpreadsheetRow => row !== null);
}

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const rows = loadRows();
  const groups = groupFeabeRows(rows);

  console.log(`Importação FEABE: ${groups.length} obras, ${rows.length} exemplares`);
  if (dryRun) {
    console.log("Modo dry-run — nenhum dado será gravado.");
    console.log("Amostra:", groups.slice(0, 8).map((g) => ({
      obra: g.workNumber,
      titulo: g.title,
      autor: g.author,
      exemplares: g.copies.map((c) => c.copyCode),
      legado: g.copies.map((c) => c.legacyNumber),
    })));
    return;
  }

  let booksCreated = 0;
  let copiesCreated = 0;

  for (const work of groups) {
    const legacyHistory = work.copies.map((c) => c.legacyNumber).join(", ");
    const existing = await prisma.book.findUnique({
      where: { workNumber: work.workNumber },
    });

    const book =
      existing ??
      (await prisma.book.create({
        data: {
          workNumber: work.workNumber,
          catalogNumber: work.catalogNumber,
          authorGroup: work.authorGroup,
          title: work.title,
          author: work.author,
          medium: work.medium,
          workType: work.workType,
          collection: work.collection,
          language: work.language,
          publisher: work.publisher,
          synopsis: work.synopsis,
          notes: [
            `Importado FEABE em ${new Date().toISOString().slice(0, 10)}`,
            `Nº legado(s) planilha: ${legacyHistory}`,
          ].join(" · "),
          categories: {
            connectOrCreate: work.categories.map((name) => ({
              where: { name },
              create: { name },
            })),
          },
        },
      }));

    if (!existing) booksCreated++;

    for (const copy of work.copies) {
      const exists = await prisma.copy.findFirst({
        where: { OR: [{ legacyNumber: copy.legacyNumber }, { code: copy.copyCode }] },
      });
      if (exists) continue;

      await prisma.copy.create({
        data: {
          bookId: book.id,
          code: copy.copyCode,
          legacyNumber: copy.legacyNumber,
          shelfOrder: copy.shelfOrder,
          status: "AVAILABLE",
        },
      });
      copiesCreated++;
    }
  }

  console.log(`Concluído: ${booksCreated} obras novas, ${copiesCreated} exemplares criados.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
