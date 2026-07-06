/** URL pública canônica em produção */
export const PRODUCTION_APP_URL = "https://www.bibliotecafeabe.com.br";

export function getAppBaseUrl(): string {
  const configured = process.env.NEXTAUTH_URL?.trim();
  if (configured) return configured.replace(/\/$/, "");

  if (process.env.VERCEL === "1" || process.env.NODE_ENV === "production") {
    return PRODUCTION_APP_URL;
  }

  return "http://localhost:3000";
}
