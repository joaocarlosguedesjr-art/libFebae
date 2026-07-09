import { NextResponse } from "next/server";

type WindowEntry = { count: number; resetAt: number };

const store = new Map<string, WindowEntry>();

/** Limpa entradas expiradas periodicamente (evita crescimento ilimitado do Map) */
let lastCleanup = 0;
function cleanupExpired(now: number) {
  if (now - lastCleanup < 60_000) return;
  lastCleanup = now;
  for (const [key, entry] of store) {
    if (now >= entry.resetAt) store.delete(key);
  }
}

export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() || "unknown";
  return request.headers.get("x-real-ip") ?? "unknown";
}

export type RateLimitConfig = {
  /** Prefixo da chave (ex.: "chat", "auth") */
  prefix: string;
  /** Máximo de requisições na janela */
  limit: number;
  /** Janela em milissegundos */
  windowMs: number;
};

export type RateLimitResult =
  | { ok: true; remaining: number }
  | { ok: false; retryAfterSec: number };

export function checkRateLimit(
  request: Request,
  { prefix, limit, windowMs }: RateLimitConfig
): RateLimitResult {
  const now = Date.now();
  cleanupExpired(now);

  const ip = getClientIp(request);
  const key = `${prefix}:${ip}`;
  const entry = store.get(key);

  if (!entry || now >= entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: limit - 1 };
  }

  if (entry.count >= limit) {
    return {
      ok: false,
      retryAfterSec: Math.max(1, Math.ceil((entry.resetAt - now) / 1000)),
    };
  }

  entry.count += 1;
  return { ok: true, remaining: limit - entry.count };
}

export function rateLimitResponse(retryAfterSec: number) {
  return NextResponse.json(
    { error: "Muitas requisições. Aguarde e tente novamente." },
    {
      status: 429,
      headers: {
        "Retry-After": String(retryAfterSec),
        "X-RateLimit-Remaining": "0",
      },
    }
  );
}

export function enforceRateLimit(request: Request, config: RateLimitConfig) {
  const result = checkRateLimit(request, config);
  if (!result.ok) {
    return rateLimitResponse(result.retryAfterSec);
  }
  return null;
}

/** Limites padrão por rota */
export const RATE_LIMITS = {
  chat: { prefix: "chat", limit: 30, windowMs: 60_000 },
  publicBooks: { prefix: "books-public", limit: 90, windowMs: 60_000 },
  authLogin: { prefix: "auth-login", limit: 15, windowMs: 15 * 60_000 },
  signupSend: { prefix: "signup-send", limit: 5, windowMs: 60 * 60_000 },
  signupSendIp: { prefix: "signup-send-ip", limit: 8, windowMs: 60 * 60_000 },
  signupResend: { prefix: "signup-resend", limit: 10, windowMs: 60 * 60_000 },
  signupConfirm: { prefix: "signup-confirm", limit: 25, windowMs: 60_000 },
  branding: { prefix: "branding", limit: 120, windowMs: 60_000 },
  adminEmailSend: { prefix: "admin-email-send", limit: 20, windowMs: 60 * 60_000 },
  passwordResetSend: { prefix: "password-reset-send", limit: 5, windowMs: 60 * 60_000 },
  passwordResetSendIp: { prefix: "password-reset-send-ip", limit: 8, windowMs: 60 * 60_000 },
  passwordResetResend: { prefix: "password-reset-resend", limit: 10, windowMs: 60 * 60_000 },
  passwordResetVerify: { prefix: "password-reset-verify", limit: 25, windowMs: 60_000 },
  passwordResetComplete: { prefix: "password-reset-complete", limit: 10, windowMs: 60 * 60_000 },
} as const satisfies Record<string, RateLimitConfig>;
