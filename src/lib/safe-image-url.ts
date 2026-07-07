const MAX_IMAGE_URL_LENGTH = 2048;

const BLOCKED_HOSTNAMES = new Set([
  "localhost",
  "127.0.0.1",
  "0.0.0.0",
  "::1",
  "[::1]",
]);

/** IPv4 privado/link-local — evita SSRF se a URL for usada no servidor no futuro */
function isPrivateOrLocalIpv4(host: string): boolean {
  const match = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(host);
  if (!match) return false;

  const octets = match.slice(1).map(Number);
  if (octets.some((o) => o > 255)) return false;

  const [a, b] = octets;
  if (a === 10) return true;
  if (a === 127) return true;
  if (a === 0) return true;
  if (a === 169 && b === 254) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  return false;
}

function isBlockedHostname(hostname: string): boolean {
  const host = hostname.toLowerCase().replace(/\.$/, "");
  if (!host) return true;
  if (BLOCKED_HOSTNAMES.has(host)) return true;
  if (host.endsWith(".localhost") || host.endsWith(".local")) return true;
  if (isPrivateOrLocalIpv4(host)) return true;
  return false;
}

/**
 * Valida URL de capa externa: apenas HTTPS público, sem credenciais embutidas.
 * A imagem é carregada pelo navegador do cliente — nunca buscamos no servidor.
 */
export function isSafeExternalImageUrl(value: string): boolean {
  if (!value || value.length > MAX_IMAGE_URL_LENGTH) return false;

  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return false;
  }

  if (url.protocol !== "https:") return false;
  if (url.username || url.password) return false;
  if (isBlockedHostname(url.hostname)) return false;

  return true;
}

/** Retorna a URL se segura, ou null (útil na API e no cliente) */
export function sanitizeCoverImageUrl(value: string | null | undefined): string | null {
  if (!value) return null;
  return isSafeExternalImageUrl(value) ? value : null;
}
