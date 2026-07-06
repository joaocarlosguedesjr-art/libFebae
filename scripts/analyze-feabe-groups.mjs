import fs from "node:fs";
import XLSX from "xlsx";

const file = fs.readdirSync(".").find((f) => f.includes("LIVROS_FEABE") && f.endsWith(".xlsx"));
if (!file) throw new Error("Planilha não encontrada");

function norm(s) {
  return s
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function parseAuthor(raw) {
  const parts = raw.split(/\s[-–—]\s/);
  if (parts.length >= 2) {
    return { medium: parts[0].trim(), spiritualAuthor: parts.slice(1).join(" - ").trim() };
  }
  return { medium: null, spiritualAuthor: raw.trim() };
}

const wb = XLSX.readFile(file);
const data = XLSX.utils.sheet_to_json(wb.Sheets["Table 1"], { header: 1, defval: "" });
const rows = data
  .slice(1)
  .filter((r) => String(r[1] ?? "").trim() && String(r[2] ?? "").trim())
  .map((r) => ({
    legacyNumber: Number(r[0]),
    title: String(r[1]).trim(),
    authorRaw: String(r[2]).trim(),
  }));

const groups = new Map();
for (const row of rows) {
  const { spiritualAuthor } = parseAuthor(row.authorRaw);
  const key = `${norm(row.title)}|${norm(spiritualAuthor)}`;
  if (!groups.has(key)) groups.set(key, []);
  groups.get(key).push(row);
}

console.log("Total linhas:", rows.length);
console.log("Obras únicas (título + autor espiritual):", groups.size);
console.log("Exemplares extras (cópias):", rows.length - groups.size);

const multi = [...groups.entries()].filter(([, v]) => v.length > 1);
console.log("Obras com múltiplos exemplares:", multi.length);
console.log("Amostras multi-exemplar:");
for (const [k, v] of multi.slice(0, 8)) {
  console.log(`  ${v.length}x ${v[0].title} (${v[0].authorRaw}) nums: ${v.map((x) => x.legacyNumber).join(", ")}`);
}

// Compare T1 vs T2 numbering for same title
const t2data = XLSX.utils.sheet_to_json(wb.Sheets["Table 2"], { header: 1, defval: "" });
const t2map = new Map();
for (const r of t2data.slice(1)) {
  if (!r[1]) continue;
  t2map.set(norm(String(r[1])), Number(r[0]));
}
let diff = 0;
for (const row of rows) {
  const t2num = t2map.get(norm(row.title));
  if (t2num && t2num !== row.legacyNumber) diff++;
}
console.log("\nLinhas com número diferente entre Table1 e Table2:", diff);
