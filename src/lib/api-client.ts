/**
 * Cliente HTTP para chamadas à API.
 * Em produção, o HTTPS (TLS) criptografa dados em trânsito automaticamente.
 * Nunca persiste dados sensíveis — apenas envia ao backend e descarta.
 */
export async function apiPost<T>(
  url: string,
  body: unknown
): Promise<{ data?: T; error?: string; status: number }> {
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    credentials: "same-origin",
    cache: "no-store",
    body: JSON.stringify(body),
  });

  const json = await res.json().catch(() => ({}));

  if (!res.ok) {
    return {
      status: res.status,
      error: (json as { error?: string }).error ?? "Erro na requisição",
    };
  }

  return { status: res.status, data: json as T };
}
