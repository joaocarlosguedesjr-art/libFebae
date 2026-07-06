import { NextRequest } from "next/server";
import { handlers } from "@/lib/auth";
import { enforceRateLimit, RATE_LIMITS } from "@/lib/rate-limit";

export const { GET } = handlers;

export async function POST(request: NextRequest) {
  const limited = enforceRateLimit(request, RATE_LIMITS.authLogin);
  if (limited) return limited;

  return handlers.POST(request);
}
