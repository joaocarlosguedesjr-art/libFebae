const USER_AGENT = "BibliotecaFEABE-Enrichment/1.0 (+https://github.com/feabe-biblioteca)";
const FETCH_TIMEOUT_MS = 15_000;
const MAX_BODY_BYTES = 1_500_000;

const robotsCache = new Map<string, { allowed: boolean; expiresAt: number }>();

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchWithTimeout(url: string, init?: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    return await fetch(url, {
      ...init,
      signal: controller.signal,
      headers: {
        "User-Agent": USER_AGENT,
        Accept: "text/html,application/xhtml+xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "pt-BR,pt;q=0.9",
        ...(init?.headers ?? {}),
      },
      redirect: "follow",
    });
  } finally {
    clearTimeout(timeout);
  }
}

function parseRobotsRules(body: string, path: string): boolean {
  const lines = body.split(/\r?\n/);
  let applies = false;
  let allowed = true;

  for (const rawLine of lines) {
    const line = rawLine.split("#")[0]?.trim() ?? "";
    if (!line) continue;

    const agentMatch = /^User-agent:\s*(.+)$/i.exec(line);
    if (agentMatch) {
      const agent = agentMatch[1]!.trim().toLowerCase();
      applies = agent === "*" || agent.includes("biblioteca");
      continue;
    }

    if (!applies) continue;

    const disallowMatch = /^Disallow:\s*(.*)$/i.exec(line);
    if (disallowMatch) {
      const rule = disallowMatch[1]?.trim() ?? "";
      if (!rule) {
        allowed = true;
        continue;
      }
      if (path.startsWith(rule)) allowed = false;
    }

    const allowMatch = /^Allow:\s*(.*)$/i.exec(line);
    if (allowMatch) {
      const rule = allowMatch[1]?.trim() ?? "";
      if (rule && path.startsWith(rule)) allowed = true;
    }
  }

  return allowed;
}

async function isAllowedByRobots(url: URL): Promise<boolean> {
  const cacheKey = url.origin;
  const cached = robotsCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) return cached.allowed;

  try {
    const robotsUrl = `${url.origin}/robots.txt`;
    const response = await fetchWithTimeout(robotsUrl);
    if (!response.ok) {
      robotsCache.set(cacheKey, { allowed: true, expiresAt: Date.now() + 3_600_000 });
      return true;
    }
    const body = await response.text();
    const allowed = parseRobotsRules(body, url.pathname);
    robotsCache.set(cacheKey, { allowed, expiresAt: Date.now() + 3_600_000 });
    return allowed;
  } catch {
    robotsCache.set(cacheKey, { allowed: true, expiresAt: Date.now() + 300_000 });
    return true;
  }
}

export type PageFetchResult = {
  url: string;
  html: string | null;
  error: string | null;
};

export async function fetchPageHtml(url: string): Promise<PageFetchResult> {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return { url, html: null, error: "URL inválida" };
  }

  if (!["http:", "https:"].includes(parsed.protocol)) {
    return { url, html: null, error: "Protocolo não suportado" };
  }

  const allowed = await isAllowedByRobots(parsed);
  if (!allowed) {
    return { url, html: null, error: "Bloqueado por robots.txt" };
  }

  try {
    const response = await fetchWithTimeout(url);
    if (!response.ok) {
      return { url, html: null, error: `HTTP ${response.status}` };
    }

    const contentType = response.headers.get("content-type") ?? "";
    if (!contentType.includes("text/html") && !contentType.includes("application/xhtml")) {
      return { url, html: null, error: "Conteúdo não é HTML" };
    }

    const buffer = await response.arrayBuffer();
    if (buffer.byteLength > MAX_BODY_BYTES) {
      return { url, html: null, error: "Página muito grande" };
    }

    const html = new TextDecoder("utf-8", { fatal: false }).decode(buffer);
    return { url, html, error: null };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Falha ao buscar página";
    return { url, html: null, error: message };
  }
}

export async function fetchPagesWithDelay(
  urls: string[],
  delayMs = 800
): Promise<PageFetchResult[]> {
  const results: PageFetchResult[] = [];
  for (const url of urls) {
    results.push(await fetchPageHtml(url));
    if (delayMs > 0) await sleep(delayMs);
  }
  return results;
}
