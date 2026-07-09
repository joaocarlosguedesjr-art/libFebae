import { createHash, randomInt } from "node:crypto";

export const OTP_TTL_MS = 10 * 60 * 1000;
export const OTP_RESEND_COOLDOWN_MS = 60 * 1000;
export const OTP_MAX_ATTEMPTS = 5;
export const PASSWORD_RESET_COMPLETE_WINDOW_MS = 15 * 60 * 1000;

export function hashOtpCode(code: string, email: string): string {
  const secret = process.env.AUTH_SECRET ?? "dev-secret";
  return createHash("sha256").update(`${code}:${email}:${secret}`).digest("hex");
}

export function generateOtpCode(): string {
  return String(randomInt(0, 1_000_000)).padStart(6, "0");
}

export function normalizeOtpInput(code: string): string {
  return code.replace(/\D/g, "");
}
