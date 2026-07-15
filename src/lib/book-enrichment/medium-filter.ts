/** Filtros de priorização para enriquecimento por médium/autor. */

const CHICO_XAVIER_PATTERNS = [
  "francisco c. xavier",
  "francisco cândido xavier",
  "francisco candico xavier",
  "fransisco candido xavier",
  "chico xavier",
];

export function normalizeMediumFilter(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

/** Alias amigáveis para CLI (--medium chico). */
const MEDIUM_ALIASES: Record<string, string[]> = {
  chico: CHICO_XAVIER_PATTERNS,
  fcw: CHICO_XAVIER_PATTERNS,
  "francisco cândido xavier": CHICO_XAVIER_PATTERNS,
  "francisco c. xavier": CHICO_XAVIER_PATTERNS,
};

export function resolveMediumPatterns(filter: string): string[] {
  const key = normalizeMediumFilter(filter);
  return MEDIUM_ALIASES[key] ?? [key];
}

export function matchesMediumFilter(
  medium: string | null | undefined,
  filter: string
): boolean {
  if (!medium?.trim()) return false;
  const normalizedMedium = normalizeMediumFilter(medium);
  const patterns = resolveMediumPatterns(filter).map(normalizeMediumFilter);
  return patterns.some(
    (pattern) =>
      normalizedMedium.includes(pattern) || pattern.includes(normalizedMedium)
  );
}

export const CHICO_XAVIER_MEDIUM_LABEL = "Francisco Cândido Xavier";
