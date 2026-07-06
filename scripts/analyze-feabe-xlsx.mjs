import fs from "node:fs";
import XLSX from "xlsx";

const file = fs.readdirSync(".").find((f) => f.includes("LIVROS_FEABE") && f.endsWith(".xlsx"));
if (!file) {
  console.error("Planilha não encontrada");
  process.exit(1);
}

const wb = XLSX.readFile(file);

function parseSheet(name) {
  const data = XLSX.utils.sheet_to_json(wb.Sheets[name], { header: 1, defval: "" });
  return data
    .slice(1)
    .filter((r) => String(r[1] ?? "").trim() && String(r[2] ?? "").trim())
    .map((r) => ({
      num: r[0],
      title: String(r[1]).trim(),
      author: String(r[2]).trim(),
    }));
}

const t1 = parseSheet("Table 1");
const t2 = parseSheet("Table 2");

console.log("Arquivo:", file);
console.log("Table 1:", t1.length, "obras");
console.log("Table 2:", t2.length, "obras");

const nums = (rows) => rows.map((r) => Number(r.num)).filter((n) => !Number.isNaN(n));
const t1nums = nums(t1);
const t2nums = nums(t2);
console.log("T1 num range:", Math.min(...t1nums), "-", Math.max(...t1nums));
console.log("T2 num range:", Math.min(...t2nums), "-", Math.max(...t2nums));

const t1titles = new Set(t1.map((r) => r.title.toLowerCase()));
const overlap = t2.filter((r) => t1titles.has(r.title.toLowerCase()));
console.log("Títulos em comum entre abas:", overlap.length);

const freq = {};
for (const r of t1) {
  const a = r.author.toLowerCase();
  freq[a] = (freq[a] || 0) + 1;
}
console.log("\nTop 30 autores (Table 1):");
for (const [a, c] of Object.entries(freq).sort((x, y) => y[1] - x[1]).slice(0, 30)) {
  console.log(`  ${c}\t${a}`);
}

const patterns = { kardec: 0, chico: 0, andre: 0, emmanuel: 0, hyphen: 0, feb: 0 };
for (const r of t1) {
  const a = r.author.toLowerCase();
  if (a.includes("kardec")) patterns.kardec++;
  if (a.includes("xavier") || a.includes("chico")) patterns.chico++;
  if (a.includes("andré luiz") || a.includes("andre luiz")) patterns.andre++;
  if (a.includes("emmanuel")) patterns.emmanuel++;
  if (a.includes("-") || a.includes("–")) patterns.hyphen++;
}

console.log("\nPadrões de autor (T1):", patterns);
console.log("\nAmostras autor com hífen:");
for (const r of t1.filter((x) => x.author.includes("-")).slice(0, 20)) {
  console.log(`  ${r.author} | ${r.title}`);
}

const numDup = {};
for (const r of t1) {
  const n = String(r.num);
  numDup[n] = (numDup[n] || 0) + 1;
}
const dups = Object.entries(numDup).filter(([, c]) => c > 1);
console.log("\nNúmeros duplicados T1:", dups.length);
if (dups.length) console.log(dups.slice(0, 10));

// Unique titles in T1
const titleDup = {};
for (const r of t1) {
  const t = r.title.toLowerCase();
  titleDup[t] = (titleDup[t] || 0) + 1;
}
const titleDups = Object.entries(titleDup).filter(([, c]) => c > 1);
console.log("\nTítulos duplicados T1:", titleDups.length);
if (titleDups.length) {
  for (const [t, c] of titleDups.slice(0, 10)) {
    console.log(`  ${c}x ${t}`);
  }
}
