import type { SpiritWorkType } from "@/generated/prisma";

/** Linha bruta da planilha FEABE */
export type FeabeSpreadsheetRow = {
  legacyNumber: number;
  shelfOrder: number;
  title: string;
  authorRaw: string;
};

/** Obra enriquecida para importação */
export type FeabeCatalogEntry = {
  legacyNumber: number;
  shelfOrder: number;
  workNumber: number;
  catalogNumber: string;
  copyCode: string;
  copyIndex: number | null;
  title: string;
  author: string;
  medium: string | null;
  authorGroup: string;
  authorCode: string;
  section: string;
  workType: SpiritWorkType;
  collection: string | null;
  categories: string[];
  language: string;
  publisher: string | null;
  synopsis: string | null;
  notes: string | null;
};

export type FeabeWorkGroup = {
  key: string;
  workNumber: number;
  catalogNumber: string;
  title: string;
  author: string;
  medium: string | null;
  authorGroup: string;
  authorCode: string;
  section: string;
  workType: SpiritWorkType;
  collection: string | null;
  categories: string[];
  language: string;
  publisher: string | null;
  synopsis: string | null;
  copies: Array<{
    legacyNumber: number;
    shelfOrder: number;
    copyCode: string;
    copyIndex: number | null;
  }>;
};

/** Seções do acervo FEABE (inspirado em práticas de bibliotecas espíritas + CDE) */
export const FEABE_SECTIONS = {
  COD: "Codificação Kardecista",
  ROM: "Romance / Narrativa Espírita",
  EST: "Doutrina e Estudo",
  BIO: "Biografia",
  MED: "Mediunidade",
  INF: "Infantojuvenil",
  POE: "Poesia",
  HUM: "Humor",
  DIV: "Espíritos diversos",
  OUT: "Outros",
} as const;

export type FeabeSection = keyof typeof FEABE_SECTIONS;

const MEDIUM_NAMES = [
  "francisco c. xavier",
  "francisco cândido xavier",
  "francisco candico xavier",
  "chico xavier",
  "divaldo p. franco",
  "divaldo pereira franco",
  "zilda gama",
  "maria gertrudes",
  "humberto de campos",
  "yolanda gomes",
  "hilda reichert",
  "helena g. de moraes",
  "helena g de moraes",
  "maria carolina de jesus",
  "maria carolina de jesus -",
];

const KARDEC_TITLES: Record<string, { synopsis: string; year: number; publisher: string }> = {
  "o livro dos espiritos": {
    synopsis:
      "Obra fundamental da codificação. Reúne perguntas e respostas sobre a natureza dos Espíritos, a vida após a morte e os princípios da Doutrina Espírita.",
    year: 1857,
    publisher: "FEB",
  },
  "o livro dos mediuns": {
    synopsis:
      "Trata das manifestações espíritas e da prática da mediunidade, com orientações para o estudo e o exercício seguro da faculdade mediúnica.",
    year: 1861,
    publisher: "FEB",
  },
  "o evangelho segundo o espiritismo": {
    synopsis:
      "Comentários às máximas morais do Cristo em consonância com o Espiritismo, para aplicação no lar e na convivência cristã.",
    year: 1864,
    publisher: "FEB",
  },
  "o ceu e o inferno": {
    synopsis:
      "Exame comparado das doutrinas sobre a passagem da vida corporal à vida espiritual, o futuro da humanidade e o estado das almas após a morte.",
    year: 1865,
    publisher: "FEB",
  },
  "a genese": {
    synopsis:
      "Exame das origens do universo, da vida e do homem à luz da Doutrina Espírita, conciliando ciência e filosofia espiritual.",
    year: 1868,
    publisher: "FEB",
  },
  "o que e o espiritismo": {
    synopsis:
      "Introdução didática à Doutrina Espírita e noções elementares sobre o mundo invisível e as manifestações dos Espíritos.",
    year: 1859,
    publisher: "FEB",
  },
  "a obsessao": {
    synopsis:
      "Compilação de ensinamentos sobre a obsessão espiritual, suas causas, efeitos e os meios de desobsessão, com orientações para o estudo e a prática espírita.",
    year: 1865,
    publisher: "FEB",
  },
  "coletanea de preces espiritas": {
    synopsis:
      "Reunião de preces espíritas para uso no culto doméstico e nas reuniões mediúnicas, com invocações, ações de graças e pedidos de auxílio espiritual.",
    year: 1865,
    publisher: "FEB",
  },
  "definicoes espiritas": {
    synopsis:
      "Vocabulário de termos e expressões usados na Doutrina Espírita, com definições claras para orientar o estudo e uniformizar a linguagem espírita.",
    year: 1865,
    publisher: "FEB",
  },
  "iniciacao espirita": {
    synopsis:
      "Introdução ao estudo da Doutrina Espírita, apresentando noções fundamentais sobre Deus, o universo, os Espíritos e as leis morais que regem a vida.",
    year: 1865,
    publisher: "FEB",
  },
  "viagem espirita": {
    synopsis:
      "Relato de viagem espiritual em que o codificador descreve observações sobre o mundo espiritual e reflexões sobre a conduta humana e a vida após a morte.",
    year: 1865,
    publisher: "FEB",
  },
};

/** Autores espirituais e codificadores — ordem de prioridade na estante FEABE */
const AUTHOR_REGISTRY: Array<{
  code: string;
  group: string;
  patterns: string[];
  section: FeabeSection;
  workType: SpiritWorkType;
  collection?: string;
  categories: string[];
}> = [
  {
    code: "KAR",
    group: "Allan Kardec — Codificação",
    patterns: ["allan kardec", "kardec"],
    section: "COD",
    workType: "CODIFICATION",
    categories: ["Codificação Kardecista"],
  },
  {
    code: "ALU",
    group: "André Luiz",
    patterns: ["andré luiz", "andre luiz"],
    section: "ROM",
    workType: "PSYCHOGRAPHED",
    collection: "Série André Luiz",
    categories: ["Romance Espírita", "Série André Luiz"],
  },
  {
    code: "EMM",
    group: "Emmanuel",
    patterns: ["emmanuel"],
    section: "ROM",
    workType: "PSYCHOGRAPHED",
    collection: "Histórias de Emmanuel",
    categories: ["Romance Espírita", "Histórias de Emmanuel"],
  },
  {
    code: "HUC",
    group: "Humberto de Campos",
    patterns: ["humberto de campos"],
    section: "ROM",
    workType: "PSYCHOGRAPHED",
    categories: ["Romance Espírita"],
  },
  {
    code: "MEI",
    group: "Meimei",
    patterns: ["meimei"],
    section: "ROM",
    workType: "PSYCHOGRAPHED",
    categories: ["Romance Espírita", "Infantojuvenil"],
  },
  {
    code: "JOA",
    group: "Joanna de Ângelis",
    patterns: ["joanna de ângelis", "joanna de angelis"],
    section: "ROM",
    workType: "PSYCHOGRAPHED",
    categories: ["Romance Espírita"],
  },
  {
    code: "AME",
    group: "Amélia Rodrigues",
    patterns: ["amélia rodrigues", "amelia rodrigues"],
    section: "ROM",
    workType: "PSYCHOGRAPHED",
    categories: ["Romance Espírita", "Passos de Jesus"],
  },
  {
    code: "VHU",
    group: "Victor Hugo",
    patterns: ["victor hugo"],
    section: "ROM",
    workType: "PSYCHOGRAPHED",
    categories: ["Romance Espírita"],
  },
  {
    code: "MPM",
    group: "Manoel Philomeno de Miranda",
    patterns: ["manoel p. de miranda", "manoel philomeno de miranda", "manoel p de miranda"],
    section: "ROM",
    workType: "PSYCHOGRAPHED",
    categories: ["Romance Espírita"],
  },
  {
    code: "HAM",
    group: "Hammed",
    patterns: ["hammed"],
    section: "ROM",
    workType: "PSYCHOGRAPHED",
    categories: ["Romance Espírita"],
  },
  {
    code: "JWR",
    group: "J. W. Rochester",
    patterns: ["j. w. rochester", "j w rochester"],
    section: "ROM",
    workType: "PSYCHOGRAPHED",
    categories: ["Romance Espírita"],
  },
  {
    code: "ESP",
    group: "Espíritos diversos",
    patterns: [
      "espíritos diversos",
      "espiritos diversos",
      "diversos espíritos",
      "diversos espiritos",
    ],
    section: "DIV",
    workType: "COMPILATION",
    categories: ["Romance Espírita"],
  },
  {
    code: "RIC",
    group: "Richard Simonetti",
    patterns: ["richard simonetti"],
    section: "EST",
    workType: "STUDY",
    categories: ["Doutrina e Estudo"],
  },
  {
    code: "LDN",
    group: "Leon Denis",
    patterns: ["leon denis"],
    section: "EST",
    workType: "STUDY",
    categories: ["Doutrina e Estudo"],
  },
  {
    code: "HCM",
    group: "Hermínio C. Miranda",
    patterns: ["herminio c. miranda", "hermínio c. miranda", "hermínio de miranda", "herminio de miranda"],
    section: "EST",
    workType: "STUDY",
    categories: ["Doutrina e Estudo"],
  },
  {
    code: "EBZ",
    group: "Ernesto Bozzano",
    patterns: ["ernesto bozzano"],
    section: "EST",
    workType: "STUDY",
    categories: ["Mediunidade", "Doutrina e Estudo"],
  },
  {
    code: "MPR",
    group: "Martins Peralta",
    patterns: ["martins peralva", "martins peralta"],
    section: "EST",
    workType: "STUDY",
    categories: ["Doutrina e Estudo"],
  },
  {
    code: "VLV",
    group: "Valdo Vieira",
    patterns: ["valdo vieira"],
    section: "EST",
    workType: "STUDY",
    categories: ["Doutrina e Estudo"],
  },
  {
    code: "ZGM",
    group: "Zilda Gama",
    patterns: ["zilda gama"],
    section: "ROM",
    workType: "PSYCHOGRAPHED",
    categories: ["Romance Espírita"],
  },
  {
    code: "YAP",
    group: "Yvonne A. Pereira",
    patterns: ["yvonne a. pereira", "yvonne pereira", "yvonne do amaral pereira"],
    section: "BIO",
    workType: "BIOGRAPHY",
    categories: ["Biografia"],
  },
  {
    code: "IAP",
    group: "Ivone A. Pereira",
    patterns: ["ivone a. pereira", "ivone amaral pereira"],
    section: "ROM",
    workType: "PSYCHOGRAPHED",
    categories: ["Romance Espírita"],
  },
  {
    code: "RJG",
    group: "Roque Jacinto",
    patterns: ["roque jacinto"],
    section: "EST",
    workType: "STUDY",
    categories: ["Doutrina e Estudo"],
  },
  {
    code: "CBA",
    group: "Carlos A. Baccelle",
    patterns: ["carlos a. baccelle", "carlos baccelle"],
    section: "MED",
    workType: "STUDY",
    categories: ["Mediunidade", "Doutrina e Estudo"],
  },
  {
    code: "EFM",
    group: "Eliseu Florentino da Mota",
    patterns: ["eliseu florentino"],
    section: "EST",
    workType: "STUDY",
    categories: ["Doutrina e Estudo"],
  },
  {
    code: "CAM",
    group: "Camilo",
    patterns: ["camilo flammion", "camilo"],
    section: "ROM",
    workType: "PSYCHOGRAPHED",
    categories: ["Romance Espírita"],
  },
  {
    code: "EAR",
    group: "Edgar Armond",
    patterns: ["edgar armond", "edgard armond"],
    section: "EST",
    workType: "STUDY",
    categories: ["Doutrina e Estudo"],
  },
  {
    code: "EBA",
    group: "Elias Barbosa",
    patterns: ["elias barbosa"],
    section: "EST",
    workType: "STUDY",
    categories: ["Doutrina e Estudo"],
  },
  {
    code: "ERG",
    group: "Eliseu Rigonatti",
    patterns: ["eliseu rigonatti"],
    section: "EST",
    workType: "STUDY",
    categories: ["Doutrina e Estudo"],
  },
  {
    code: "ADV",
    group: "Autores diversos",
    patterns: ["autores diversos"],
    section: "DIV",
    workType: "COMPILATION",
    categories: ["Doutrina e Estudo"],
  },
  {
    code: "CLM",
    group: "Celso Martins",
    patterns: ["celso martins"],
    section: "EST",
    workType: "STUDY",
    categories: ["Doutrina e Estudo"],
  },
  {
    code: "LSG",
    group: "Luiz Sérgio",
    patterns: ["luiz sérgio", "luiz sergio"],
    section: "ROM",
    workType: "PSYCHOGRAPHED",
    categories: ["Romance Espírita"],
  },
  {
    code: "FNO",
    group: "Fernando Ó",
    patterns: ["fernando ó", "fernando o", "fernado de ó"],
    section: "ROM",
    workType: "PSYCHOGRAPHED",
    categories: ["Romance Espírita"],
  },
  {
    code: "IJC",
    group: "Irmão Jacob",
    patterns: ["irmão jacob", "irmao jacob"],
    section: "ROM",
    workType: "PSYCHOGRAPHED",
    categories: ["Romance Espírita"],
  },
  {
    code: "BZM",
    group: "Bezerra de Menezes",
    patterns: ["bezerra de menezes"],
    section: "BIO",
    workType: "BIOGRAPHY",
    categories: ["Biografia"],
  },
  {
    code: "WLR",
    group: "Wallace Leal V. Rodrigues",
    patterns: ["wallace leal"],
    section: "EST",
    workType: "STUDY",
    categories: ["Doutrina e Estudo"],
  },
  {
    code: "IRX",
    group: "Irmão X",
    patterns: ["irmão x", "irmao x"],
    section: "ROM",
    workType: "PSYCHOGRAPHED",
    categories: ["Romance Espírita"],
  },
  {
    code: "SGT",
    group: "Salvador Gentile",
    patterns: ["salvador gentile"],
    section: "EST",
    workType: "STUDY",
    categories: ["Doutrina e Estudo"],
  },
  {
    code: "FLC",
    group: "Fernando Lacerda",
    patterns: ["fernando lacerda"],
    section: "ROM",
    workType: "PSYCHOGRAPHED",
    categories: ["Romance Espírita"],
  },
  {
    code: "ZWA",
    group: "Zeus Wantuil",
    patterns: ["zeus wantuil"],
    section: "EST",
    workType: "STUDY",
    categories: ["Mediunidade", "Doutrina e Estudo"],
  },
  {
    code: "CSH",
    group: "Cairbar Schutil",
    patterns: ["cairbar schutil", "cairbar"],
    section: "EST",
    workType: "STUDY",
    categories: ["Doutrina e Estudo"],
  },
  {
    code: "WLV",
    group: "Waldo Vieira",
    patterns: ["waldo vieira"],
    section: "EST",
    workType: "STUDY",
    categories: ["Doutrina e Estudo"],
  },
  {
    code: "LUC",
    group: "Lúcius",
    patterns: ["lúcius", "lucius", "espírito lúcius"],
    section: "ROM",
    workType: "PSYCHOGRAPHED",
    categories: ["Romance Espírita"],
  },
  {
    code: "JHP",
    group: "J. Herculano Pires",
    patterns: ["j. herculano pires", "herculano pires"],
    section: "EST",
    workType: "STUDY",
    categories: ["Doutrina e Estudo"],
  },
  {
    code: "JRZ",
    group: "Jorge Rizzini",
    patterns: ["jorge rizzini"],
    section: "EST",
    workType: "STUDY",
    categories: ["Doutrina e Estudo"],
  },
  {
    code: "ALF",
    group: "Alfredo",
    patterns: ["alfredo"],
    section: "ROM",
    workType: "PSYCHOGRAPHED",
    categories: ["Romance Espírita"],
  },
  {
    code: "PBD",
    group: "Paul Bodier",
    patterns: ["paul bodier"],
    section: "EST",
    workType: "STUDY",
    categories: ["Doutrina e Estudo"],
  },
  {
    code: "MRM",
    group: "Miramez",
    patterns: ["miramez"],
    section: "ROM",
    workType: "PSYCHOGRAPHED",
    categories: ["Romance Espírita"],
  },
  {
    code: "RGK",
    group: "Ramiro Gama",
    patterns: ["ramiro gama"],
    section: "ROM",
    workType: "PSYCHOGRAPHED",
    categories: ["Romance Espírita"],
  },
  {
    code: "SCS",
    group: "Suely Caldas Schubert",
    patterns: ["suely caldas"],
    section: "ROM",
    workType: "PSYCHOGRAPHED",
    categories: ["Romance Espírita"],
  },
  {
    code: "FCX",
    group: "Francisco Cândido Xavier — obras diversas",
    patterns: ["francisco c. xavier", "francisco cândido xavier"],
    section: "ROM",
    workType: "PSYCHOGRAPHED",
    categories: ["Romance Espírita"],
  },
  {
    code: "DPF",
    group: "Divaldo Pereira Franco — obras diversas",
    patterns: ["divaldo p. franco", "divaldo pereira franco"],
    section: "ROM",
    workType: "PSYCHOGRAPHED",
    categories: ["Romance Espírita"],
  },
];

export function normalizeText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

/** Chave de título para agrupar a mesma obra */
export function normalizeTitleKey(title: string): string {
  return normalizeText(title).replace(/[^\w\s]/g, "").replace(/\s+/g, " ").trim();
}

function toSpiritDisplayName(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return trimmed;
  return trimmed
    .split(/\s+/)
    .map((word) => {
      const lower = word.toLowerCase();
      if (["de", "da", "do", "das", "dos", "e"].includes(lower)) return lower;
      if (lower.length <= 3 && word.endsWith(".")) return word;
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(" ")
    .replace(/\bDe\b/g, "de")
    .replace(/\bDa\b/g, "da")
    .replace(/\bDo\b/g, "do")
    .replace(/\bDas\b/g, "das")
    .replace(/\bDos\b/g, "dos")
    .replace(/\bE\b/g, "e");
}

function canonicalizeSpiritPart(name: string): string {
  const cleaned = name
    .trim()
    .replace(/^esp\.?\s*[-–—]?\s*/i, "")
    .replace(/^esp[ií]rito\s+(?:conde\s+)?/i, "")
    .replace(/^írito\s+/i, "")
    .replace(/^irito\s+/i, "")
    .trim();

  const norm = normalizeText(cleaned);
  if (!norm) return name.trim();

  for (const entry of AUTHOR_REGISTRY) {
    for (const pattern of entry.patterns) {
      const p = normalizeText(pattern);
      if (norm === p || norm === normalizeText(entry.group.replace(/\s*—\s*.+$/, ""))) {
        return entry.group.replace(/\s*—\s*.+$/, "").trim();
      }
    }
  }

  const aliases: Record<string, string> = {
    "allan kardec": "Allan Kardec",
    kardec: "Allan Kardec",
    "andre luiz": "André Luiz",
    "andré luiz": "André Luiz",
    alfredo: "Alfredo",
    "espirito alfredo": "Alfredo",
    "irito alfredo": "Alfredo",
    "írito alfredo": "Alfredo",
    emmanuel: "Emmanuel",
    "amelia rodrigues": "Amélia Rodrigues",
    "amélia rodrigues": "Amélia Rodrigues",
    "humberto de campos": "Humberto de Campos",
    "espirito humberto de campos": "Humberto de Campos",
    "joanna de angelis": "Joanna de Ângelis",
    "joanna de ângelis": "Joanna de Ângelis",
    lucius: "Lúcius",
    lúcius: "Lúcius",
    "espirito lucius": "Lúcius",
    meimei: "Meimei",
    hammed: "Hammed",
    camilo: "Camilo",
    "bezerra de menezes": "Bezerra de Menezes",
    "irmao jacob": "Irmão Jacob",
    "irmão jacob": "Irmão Jacob",
    "irmao x": "Irmão X",
    "irmão x": "Irmão X",
    "j w rochester": "J. W. Rochester",
    "j. w. rochester": "J. W. Rochester",
    "espirito conde j w rochester": "J. W. Rochester",
    "victor hugo": "Victor Hugo",
    "manoel p de miranda": "Manoel Philomeno de Miranda",
    "manoel philomeno de miranda": "Manoel Philomeno de Miranda",
    "richard simonetti": "Richard Simonetti",
    "leon denis": "Leon Denis",
    "waldo vieira": "Waldo Vieira",
    "zilda gama": "Zilda Gama",
  };

  if (aliases[norm]) return aliases[norm];

  return toSpiritDisplayName(cleaned);
}

/** Normaliza grafias do autor/espírito espiritual */
export function normalizeSpiritName(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return trimmed;

  const parts = trimmed.split(/\s*[/\\]\s*/).map((part) => canonicalizeSpiritPart(part));
  return parts.join(" / ");
}

export function parseFeabeAuthor(raw: string): {
  author: string;
  medium: string | null;
} {
  const trimmed = raw.trim();
  const parts = trimmed.split(/\s[-–—]\s/);

  if (parts.length >= 2) {
    const left = parts[0].trim();
    const right = parts.slice(1).join(" - ").trim();
    const leftNorm = normalizeText(left);

    const isMedium = MEDIUM_NAMES.some((m) => leftNorm.includes(normalizeText(m)));
    if (isMedium) {
      return { author: right, medium: normalizeMediumName(left) };
    }

    return { author: right, medium: normalizeMediumName(left) };
  }

  return { author: trimmed, medium: null };
}

function normalizeMediumName(name: string): string {
  const n = normalizeText(name);
  if (n.includes("francisco") && n.includes("xavier")) return "Francisco Cândido Xavier";
  if (n.includes("divaldo")) return "Divaldo Pereira Franco";
  if (n.includes("zilda")) return "Zilda Gama";
  if (n.includes("maria gertrudes")) return "Maria Gertrudes";
  if (n.includes("dolores") && n.includes("bacel")) return "Dolores Bacellar";
  if (n.includes("j raul") || n.includes("raul teixeira")) return "J. Raul Teixeira";
  if (n.includes("heigorina")) return "Heigorina Cunha";
  if (n.includes("zibia")) return "Zibia Gaspareto";
  if (n.includes("vera krijanowski")) return "Vera Krijanowski";
  if (n.includes("francisco do espirito santo")) return "Francisco do Espírito Santo Neto";
  return name.trim();
}

export function resolveAuthorRegistry(author: string, medium: string | null) {
  const canonical = normalizeSpiritName(author);
  const authorNorm = normalizeText(canonical);

  for (const entry of AUTHOR_REGISTRY) {
    if (entry.patterns.some((p) => authorNorm === normalizeText(p))) {
      return entry;
    }
    const shortGroup = normalizeText(entry.group.replace(/\s*—\s*.+$/, ""));
    if (authorNorm === shortGroup) return entry;
  }

  for (const entry of AUTHOR_REGISTRY) {
    if (entry.patterns.some((p) => {
      const pn = normalizeText(p);
      return pn.length > 4 && authorNorm.includes(pn);
    })) {
      return entry;
    }
  }

  const slug = authorNorm
    .replace(/[^a-z0-9]+/g, "")
    .slice(0, 3)
    .toUpperCase()
    .padEnd(3, "X");

  return {
    code: slug,
    group: author.trim(),
    patterns: [],
    section: "OUT" as FeabeSection,
    workType: "OTHER" as SpiritWorkType,
    categories: ["Doutrina e Estudo"],
  };
}

function inferKardecMetadata(title: string) {
  const key = normalizeText(title);
  for (const [pattern, meta] of Object.entries(KARDEC_TITLES)) {
    if (key.includes(pattern)) return meta;
  }
  return null;
}

function inferCollection(authorCode: string, registry: (typeof AUTHOR_REGISTRY)[number]) {
  return registry.collection ?? null;
}

export function buildWorkKey(title: string, author: string, medium?: string | null): string {
  const spirit = normalizeText(normalizeSpiritName(author));
  const titleKey = normalizeTitleKey(title);
  const mediumKey = medium ? normalizeText(normalizeMediumName(medium)) : "";
  return `${spirit}|${titleKey}|${mediumKey}`;
}

export function groupFeabeRows(rows: FeabeSpreadsheetRow[]): FeabeWorkGroup[] {
  const grouped = new Map<string, FeabeWorkGroup>();

  for (const row of rows) {
    const { author: parsedAuthor, medium } = parseFeabeAuthor(row.authorRaw);
    const author = normalizeSpiritName(parsedAuthor);
    const registry = resolveAuthorRegistry(author, medium);
    const key = buildWorkKey(row.title, author, medium);

    if (!grouped.has(key)) {
      const kardecMeta = registry.code === "KAR" ? inferKardecMetadata(row.title) : null;

      grouped.set(key, {
        key,
        workNumber: 0,
        catalogNumber: "",
        title: row.title.trim(),
        author: author.trim(),
        medium,
        authorGroup: registry.group,
        authorCode: registry.code,
        section: registry.section,
        workType: registry.workType,
        collection: inferCollection(registry.code, registry),
        categories: [...registry.categories],
        language: "Português",
        publisher: kardecMeta?.publisher ?? null,
        synopsis: kardecMeta?.synopsis ?? null,
        copies: [],
      });
    }

    const work = grouped.get(key)!;
    work.copies.push({
      legacyNumber: row.legacyNumber,
      shelfOrder: row.shelfOrder,
      copyCode: "",
      copyIndex: null,
    });
  }

  assignCatalogNumbers(grouped);
  assignCopyNumbers(grouped);

  return [...grouped.values()].sort((a, b) => a.workNumber - b.workNumber);
}

function authorGroupSortIndex(code: string): number {
  const idx = AUTHOR_REGISTRY.findIndex((entry) => entry.code === code);
  return idx >= 0 ? idx : 1000 + code.charCodeAt(0);
}

function sortableLabel(value: string): string {
  return normalizeText(value).replace(/^[^a-z0-9]+/, "");
}

function compareWorks(a: FeabeWorkGroup, b: FeabeWorkGroup): number {
  const registryCmp = authorGroupSortIndex(a.authorCode) - authorGroupSortIndex(b.authorCode);
  if (registryCmp !== 0) return registryCmp;

  const groupCmp = sortableLabel(a.authorGroup).localeCompare(sortableLabel(b.authorGroup), "pt-BR");
  if (groupCmp !== 0) return groupCmp;

  const spiritCmp = sortableLabel(normalizeSpiritName(a.author)).localeCompare(
    sortableLabel(normalizeSpiritName(b.author)),
    "pt-BR"
  );
  if (spiritCmp !== 0) return spiritCmp;

  const titleCmp = sortableLabel(a.title).localeCompare(sortableLabel(b.title), "pt-BR");
  if (titleCmp !== 0) return titleCmp;

  return sortableLabel(a.medium ?? "").localeCompare(sortableLabel(b.medium ?? ""), "pt-BR");
}

function assignCatalogNumbers(grouped: Map<string, FeabeWorkGroup>) {
  const works = [...grouped.values()].sort(compareWorks);

  works.forEach((work, index) => {
    work.workNumber = index + 1;
    work.catalogNumber = String(work.workNumber);
  });
}

function assignCopyNumbers(grouped: Map<string, FeabeWorkGroup>) {
  for (const work of grouped.values()) {
    work.copies.sort((a, b) => a.legacyNumber - b.legacyNumber);

    if (work.copies.length === 1) {
      work.copies[0].copyCode = work.catalogNumber;
      work.copies[0].copyIndex = null;
      continue;
    }

    work.copies.forEach((copy, index) => {
      copy.copyIndex = index + 1;
      copy.copyCode = `${work.catalogNumber}.${index + 1}`;
    });
  }
}

function buildHistoryNote(work: FeabeWorkGroup, copy: FeabeWorkGroup["copies"][number]) {
  const legacyList = work.copies.map((c) => c.legacyNumber).join(", ");
  const parts = [
    `Nº legado deste exemplar: ${copy.legacyNumber}`,
    `Ordem estante (Table 2): ${copy.shelfOrder}`,
    `Obra nº ${work.catalogNumber}`,
  ];

  if (work.copies.length > 1) {
    parts.push(`Exemplares da mesma obra: ${legacyList}`);
  }

  return parts.join(" · ");
}

export function flattenFeabeCatalog(groups: FeabeWorkGroup[]): FeabeCatalogEntry[] {
  const entries: FeabeCatalogEntry[] = [];

  for (const work of groups) {
    for (const copy of work.copies) {
      entries.push({
        legacyNumber: copy.legacyNumber,
        shelfOrder: copy.shelfOrder,
        workNumber: work.workNumber,
        catalogNumber: work.catalogNumber,
        copyCode: copy.copyCode,
        copyIndex: copy.copyIndex,
        title: work.title,
        author: work.author,
        medium: work.medium,
        authorGroup: work.authorGroup,
        authorCode: work.authorCode,
        section: work.section,
        workType: work.workType,
        collection: work.collection,
        categories: work.categories,
        language: work.language,
        publisher: work.publisher,
        synopsis: work.synopsis,
        notes: buildHistoryNote(work, copy),
      });
    }
  }

  return entries.sort((a, b) => {
    if (a.workNumber !== b.workNumber) return a.workNumber - b.workNumber;
    const ai = a.copyIndex ?? 0;
    const bi = b.copyIndex ?? 0;
    return ai - bi;
  });
}

export function summarizeFeabeCatalog(groups: FeabeWorkGroup[]) {
  const bySection: Record<string, number> = {};
  const byAuthor: Record<string, number> = {};
  let totalCopies = 0;

  for (const work of groups) {
    bySection[work.section] = (bySection[work.section] ?? 0) + 1;
    byAuthor[work.authorCode] = (byAuthor[work.authorCode] ?? 0) + 1;
    totalCopies += work.copies.length;
  }

  return {
    uniqueWorks: groups.length,
    totalCopies,
    workNumberRange: groups.length
      ? { from: 1, to: groups.length }
      : { from: 0, to: 0 },
    multiCopyWorks: groups.filter((g) => g.copies.length > 1).length,
    bySection,
    topAuthors: Object.entries(byAuthor)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15)
      .map(([code, count]) => ({ code, count })),
  };
}
