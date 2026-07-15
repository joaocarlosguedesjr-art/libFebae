import type { CseSearchResult } from "./types";

const CSE_ENDPOINT = "https://www.googleapis.com/customsearch/v1";
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 2000;

export type GoogleCseConfig = {
  apiKey: string;
  cx: string;
};

export function getGoogleCseConfig(): GoogleCseConfig | null {
  const apiKey = process.env.GOOGLE_CSE_API_KEY?.trim();
  const cx = process.env.GOOGLE_CSE_CX?.trim();
  if (!apiKey || !cx) return null;
  return { apiKey, cx };
}

/** Erros de configuração da API — obra pode ser reprocessada após correção. */
export function isRetryableApiError(message: string): boolean {
  const lower = message.toLowerCase();
  return (
    lower.includes("referer") ||
    lower.includes("api key not valid") ||
    lower.includes("invalid argument") ||
    lower.includes("access not configured") ||
    lower.includes("forbidden")
  );
}

export function isFatalApiConfigError(message: string): boolean {
  return isRetryableApiError(message);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

type CseApiItem = {
  title?: string;
  link?: string;
  snippet?: string;
  displayLink?: string;
};

type CseApiResponse = {
  items?: CseApiItem[];
  error?: { message?: string; code?: number };
};

export class GoogleCseClient {
  private lastRequestAt = 0;

  constructor(
    private readonly config: GoogleCseConfig,
    private readonly minIntervalMs = 1100
  ) {}

  private async throttle(): Promise<void> {
    const elapsed = Date.now() - this.lastRequestAt;
    if (elapsed < this.minIntervalMs) {
      await sleep(this.minIntervalMs - elapsed);
    }
    this.lastRequestAt = Date.now();
  }

  async search(query: string, num = 10): Promise<CseSearchResult[]> {
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      await this.throttle();

      const params = new URLSearchParams({
        key: this.config.apiKey,
        cx: this.config.cx,
        q: query,
        num: String(Math.min(num, 10)),
        gl: "br",
        lr: "lang_pt",
        safe: "active",
      });

      const response = await fetch(`${CSE_ENDPOINT}?${params.toString()}`);
      const data = (await response.json()) as CseApiResponse;

      if (!response.ok) {
        const message = data.error?.message ?? `HTTP ${response.status}`;
        if (response.status === 429 && attempt < MAX_RETRIES) {
          await sleep(RETRY_DELAY_MS * attempt);
          continue;
        }
        throw new Error(`Google CSE: ${message}`);
      }

      return (data.items ?? [])
        .filter(
          (item): item is Required<Pick<CseApiItem, "link">> & CseApiItem =>
            Boolean(item.link)
        )
        .map((item) => ({
          title: item.title ?? "",
          link: item.link!,
          snippet: item.snippet ?? "",
          displayLink: item.displayLink ?? "",
        }));
    }

    return [];
  }
}
