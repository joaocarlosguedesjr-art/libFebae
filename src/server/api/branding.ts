import { getPublicBranding } from "@/lib/branding";
import { enforceRateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const limited = enforceRateLimit(request, RATE_LIMITS.branding);
  if (limited) return limited;

  const branding = await getPublicBranding();
  return NextResponse.json(
    {
      ...branding,
      catalogAssistantHref: "/catalogo?assistente=1",
    },
    {
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
      },
    }
  );
}
