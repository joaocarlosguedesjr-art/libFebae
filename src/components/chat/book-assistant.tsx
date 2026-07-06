"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { MessageCircle, Send, X, Bot, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ChatBook = {
  id: string;
  title: string;
  author: string;
  excerpt: string;
  availableCopies: number;
};

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  books?: ChatBook[];
};

const SUGGESTIONS = [
  "Obras de codificação kardecista",
  "Romances espíritas de André Luiz",
  "Livros psicografados por Chico Xavier",
  "Obras sobre mediunidade",
];

export const OPEN_ASSISTANT_EVENT = "biblioteca:open-assistant";

function formatMessage(text: string) {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} className="font-semibold text-slate-900">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return part.split("\n").map((line, j, arr) => (
      <span key={`${i}-${j}`}>
        {line}
        {j < arr.length - 1 && <br />}
      </span>
    ));
  });
}

export function openBookAssistant() {
  window.dispatchEvent(new CustomEvent(OPEN_ASSISTANT_EVENT));
}

export function BookAssistant() {
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Olá! Sou o assistente da biblioteca. Descreva o que você procura — tema, autor ou estilo — e buscarei no acervo pelas sinopses dos livros.",
    },
  ]);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const handler = () => setOpen(true);
    window.addEventListener(OPEN_ASSISTANT_EVENT, handler);
    return () => window.removeEventListener(OPEN_ASSISTANT_EVENT, handler);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  async function sendMessage(text: string) {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    const userMsg: Message = {
      id: `u-${Date.now()}`,
      role: "user",
      content: trimmed,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmed }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error ?? "Erro ao consultar acervo");
      }

      setMessages((prev) => [
        ...prev,
        {
          id: `a-${Date.now()}`,
          role: "assistant",
          content: data.reply,
          books: data.books,
        },
      ]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          id: `e-${Date.now()}`,
          role: "assistant",
          content:
            error instanceof Error
              ? error.message
              : "Não foi possível consultar o acervo. Tente novamente.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  if (!mounted) return null;

  return createPortal(
    <>
      <div
        className={cn(
          "fixed z-[9998] flex flex-col overflow-hidden border border-brand-200 bg-white shadow-2xl transition-all duration-300",
          "inset-x-0 bottom-0 max-h-[85vh] rounded-t-2xl",
          "md:inset-x-auto md:bottom-24 md:right-6 md:w-[400px] md:rounded-2xl",
          open ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-8 opacity-0"
        )}
        aria-hidden={!open}
        role="dialog"
        aria-label="Assistente do acervo"
      >
        <div className="flex items-center justify-between border-b border-brand-200 bg-brand-700 px-4 py-3 text-white">
          <div className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            <div>
              <p className="font-semibold">Assistente do acervo</p>
              <p className="text-xs text-brand-100">Consulta por sinopses</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="rounded-lg p-2 hover:bg-brand-600"
            aria-label="Fechar chat"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="min-h-[200px] flex-1 space-y-4 overflow-y-auto p-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={cn(
                "flex gap-2",
                msg.role === "user" ? "flex-row-reverse" : "flex-row"
              )}
            >
              <div
                className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                  msg.role === "user" ? "bg-slate-200" : "bg-brand-100 text-brand-800"
                )}
              >
                {msg.role === "user" ? (
                  <User className="h-4 w-4" />
                ) : (
                  <Bot className="h-4 w-4" />
                )}
              </div>
              <div
                className={cn(
                  "max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-relaxed",
                  msg.role === "user"
                    ? "bg-brand-700 text-white"
                    : "bg-brand-50 text-slate-700"
                )}
              >
                {formatMessage(msg.content)}
                {msg.books && msg.books.length > 0 && (
                  <div className="mt-3 space-y-2 border-t border-brand-200 pt-3">
                    {msg.books.map((book) => (
                      <div
                        key={book.id}
                        className="rounded-lg bg-white p-2 text-xs text-slate-600 ring-1 ring-brand-100"
                      >
                        <p className="font-medium text-slate-900">{book.title}</p>
                        <p>{book.author}</p>
                        <p className="mt-1 line-clamp-2">{book.excerpt}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100">
                <Bot className="h-4 w-4 text-brand-800" />
              </div>
              <div className="rounded-2xl bg-brand-50 px-3 py-2 text-sm text-slate-500">
                Buscando no acervo…
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {messages.length <= 1 && (
          <div className="flex flex-wrap gap-2 border-t border-brand-100 px-4 py-2">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => sendMessage(s)}
                className="rounded-full bg-brand-50 px-3 py-1.5 text-xs text-brand-800 hover:bg-brand-100"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        <form
          className="flex gap-2 border-t border-brand-200 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]"
          onSubmit={(e) => {
            e.preventDefault();
            sendMessage(input);
          }}
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ex: livros sobre mediunidade e estudo…"
            className="min-h-11 flex-1 rounded-xl border border-slate-300 px-3 text-base outline-none focus:ring-2 focus:ring-brand-500"
            maxLength={500}
            disabled={loading}
          />
          <Button type="submit" size="icon" disabled={loading || !input.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
        <p className="border-t border-brand-100 px-4 py-2 text-center text-[10px] text-slate-400">
          Mensagens usadas apenas para busca no acervo e não são armazenadas.{" "}
          <a href="/privacidade" className="underline hover:text-slate-600">
            Privacidade
          </a>
        </p>
      </div>

      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-4 z-[9999] flex h-14 items-center gap-2 rounded-full bg-brand-700 px-5 text-sm font-semibold text-white shadow-xl ring-4 ring-brand-700/20 transition hover:bg-brand-800 active:scale-95 md:bottom-8 md:right-8"
          style={{ paddingBottom: "max(0px, env(safe-area-inset-bottom))" }}
          aria-label="Abrir assistente do acervo"
        >
          <MessageCircle className="h-6 w-6" />
          <span>Assistente</span>
        </button>
      )}
    </>,
    document.body
  );
}
