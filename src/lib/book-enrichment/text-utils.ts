/** Normaliza texto para comparação (acentos, case, pontuação). */
export function normalizeText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Similaridade 0–1 entre dois textos (tokens em comum / união). */
export function tokenSimilarity(a: string, b: string): number {
  const tokensA = new Set(normalizeText(a).split(" ").filter(Boolean));
  const tokensB = new Set(normalizeText(b).split(" ").filter(Boolean));
  if (tokensA.size === 0 || tokensB.size === 0) return 0;

  let intersection = 0;
  for (const token of tokensA) {
    if (tokensB.has(token)) intersection++;
  }

  const union = new Set([...tokensA, ...tokensB]).size;
  return intersection / union;
}

/** Remove ruído de edição/formato do título para comparação. */
export function stripEditionNoise(title: string): string {
  return normalizeText(title)
    .replace(/\bvol\b\.?\s*\d+\b/g, " ")
    .replace(/\bed\b\.?\s*\d+\b/g, " ")
    .replace(/\bnova edicao\b/g, " ")
    .replace(/\bbolso\b/g, " ")
    .replace(/\blivrinho\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Retorna score 0–100 de similaridade do título (estrito contra falsos positivos). */
export function titleSimilarityScore(expectedTitle: string, candidate: string): number {
  const expected = stripEditionNoise(expectedTitle);
  const candidateClean = stripEditionNoise(candidate);

  if (!expected || !candidateClean) return 0;
  if (expected === candidateClean) return 100;

  const expectedTokens = expected.split(" ").filter(Boolean);
  const candidateTokens = candidateClean.split(" ").filter(Boolean);
  if (expectedTokens.length === 0 || candidateTokens.length === 0) return 0;

  // Exige que o título esperado ocupe a maior parte do candidato
  // (evita "Desobsessão" casar com "Estudando a Desobsessão").
  const tokenScore = tokenSimilarity(expected, candidateClean);
  const coverage =
    expectedTokens.filter((token) => candidateTokens.includes(token)).length /
    expectedTokens.length;
  const extraRatio =
    Math.max(0, candidateTokens.length - expectedTokens.length) /
    Math.max(expectedTokens.length, 1);

  if (coverage >= 0.9 && extraRatio <= 0.5 && tokenScore >= 0.7) {
    return Math.round(Math.min(98, tokenScore * 100));
  }

  if (candidateClean.startsWith(expected + " ") && extraRatio <= 0.6) {
    return 96;
  }

  return Math.round(tokenScore * 100);
}

/** Sinopses genéricas de loja (não descrevem a obra). */
export function isGenericShopSynopsis(value: string): boolean {
  const n = normalizeText(value);
  const junk = [
    "compre online",
    "loja virtual",
    "retira na loja",
    "retirada na loja",
    "compra 100 segura",
    "ate 3x sem juros",
    "sem juros",
    "frete gratis",
    "adicionar ao carrinho",
  ];
  const hits = junk.filter((j) => n.includes(j)).length;
  return hits >= 2 || (hits >= 1 && n.length < 180);
}

/** Verifica se um nome aparece no texto (tokens principais). */
export function nameAppearsInText(name: string, text: string): boolean {
  const normalizedText = normalizeText(text);
  const normalizedName = normalizeText(name);
  if (!normalizedName) return false;
  if (normalizedText.includes(normalizedName)) return true;

  // Alias: Francisco Cândido Xavier ↔ Chico Xavier
  if (normalizedName.includes("francisco") && normalizedName.includes("xavier")) {
    if (normalizedText.includes("chico xavier")) return true;
  }
  if (normalizedName.includes("chico xavier")) {
    if (normalizedText.includes("francisco") && normalizedText.includes("xavier")) return true;
  }

  const nameTokens = normalizedName.split(" ").filter((t) => t.length > 2);
  if (nameTokens.length === 0) return false;

  const matched = nameTokens.filter((token) => normalizedText.includes(token));
  return matched.length >= Math.ceil(nameTokens.length * 0.6);
}

/** Limpa sinopse extraída (apenas trim e colapso de espaços — sem reescrever). */
export function cleanExtractedSynopsis(value: string): string {
  return value
    .replace(/^\s*descri[cç][aã]o\s+r[aá]pida\s*/i, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** Compara duas sinopses para detectar conflito entre fontes. */
export function synopsesConflict(a: string, b: string): boolean {
  const na = normalizeText(a);
  const nb = normalizeText(b);
  if (!na || !nb) return false;
  if (na === nb) return false;
  if (na.includes(nb) || nb.includes(na)) return false;
  return tokenSimilarity(a, b) < 0.5;
}
