/** Dados institucionais padrão — Centro Espírita FEABE */
export const INSTITUTION_DEFAULTS = {
  institutionName: "Centro Espírita FEABE",
  institutionAddress:
    "Rua Irmão Menrado, 510, Borboleta, Juiz de Fora - MG",
  institutionEmail: "joao.carlos.guedes.jr@gmail.com",
  dpoEmail: "joao.carlos.guedes.jr@gmail.com",
  loanDaysDefault: 14,
  privacyPolicyVersion: "1.0",
  termsVersion: "1.0",
  /** Caminho público da logo (em /public) */
  institutionLogoUrl: "/feabe-logo.jpeg",
} as const;

export function resolveLogoUrl(logoUrl?: string | null): string {
  const path = logoUrl?.trim() || INSTITUTION_DEFAULTS.institutionLogoUrl;
  return path.startsWith("/") ? path : `/${path}`;
}
