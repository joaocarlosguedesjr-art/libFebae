import { z } from "zod";
import { buildAssistantReply, searchBooksBySynopsis } from "@/lib/book-search";
import { enforceRateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { NextResponse } from "next/server";

const chatSchema = z.object({
  message: z.string().min(1, "Mensagem vazia").max(500, "Mensagem muito longa"),
});

export async function POST(request: Request) {
  const limited = enforceRateLimit(request, RATE_LIMITS.chat);
  if (limited) return limited;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const parsed = chatSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Mensagem inválida" },
      { status: 400 }
    );
  }

  const { message } = parsed.data;
  const matches = await searchBooksBySynopsis(message);
  const reply = buildAssistantReply(message, matches);

  return NextResponse.json({
    reply,
    books: matches.map(({ score: _score, excerpt, ...book }) => ({
      ...book,
      excerpt,
    })),
  });
}
