"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { X } from "lucide-react";
import { InstitutionLogoLink } from "@/components/institution/institution-logo-link";
import { BookAssistant } from "@/components/chat/book-assistant";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { loginSchema, type LoginInput } from "@/lib/validations";
import { cn } from "@/lib/utils";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const callbackUrl = searchParams.get("callbackUrl") ?? "/dashboard";
  const cadastroOk = searchParams.get("cadastro") === "ok";

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  async function onSubmit(data: LoginInput) {
    setLoading(true);
    const result = await signIn("credentials", {
      email: data.email,
      password: data.password,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      toast.error("E-mail ou senha incorretos");
      return;
    }

    router.push(callbackUrl);
    router.refresh();
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-brand-50 to-[var(--background)] p-4 pb-24">
      <div className="mb-6 flex flex-col items-center text-center">
        <InstitutionLogoLink size="lg" className="mb-4" />
        <h1 className="text-2xl font-bold text-slate-900">Biblioteca</h1>
        <p className="mt-1 text-slate-500">Sistema de gestão de acervo</p>
      </div>

      <div className="relative w-full max-w-md">
        <Link
          href="/catalogo"
          className="absolute -right-2 -top-2 z-10 flex h-10 w-10 items-center justify-center rounded-full border border-brand-200 bg-white text-slate-500 shadow-md transition hover:bg-brand-50 hover:text-brand-800"
          aria-label="Voltar ao catálogo"
        >
          <X className="h-5 w-5" />
        </Link>

        <Card className="border-brand-200 shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle>Entrar</CardTitle>
          </CardHeader>
          <CardContent>
            {cadastroOk && (
              <p className="mb-4 rounded-lg bg-brand-50 p-3 text-sm text-brand-800">
                Conta criada com sucesso! Faça login com seu e-mail e senha.
              </p>
            )}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  inputMode="email"
                  {...register("email")}
                />
                {errors.email && (
                  <p className="text-sm text-red-600">{errors.email.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  {...register("password")}
                />
                {errors.password && (
                  <p className="text-sm text-red-600">{errors.password.message}</p>
                )}
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Entrando..." : "Entrar"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Link
          href="/cadastro"
          className={cn(buttonVariants({ variant: "soft" }), "mt-3 w-full")}
        >
          Criar conta
        </Link>

        <p className="mt-4 text-center text-sm text-slate-500">
          <Link href="/catalogo?assistente=1" className="text-brand-700 hover:underline">
            Consultar catálogo público
          </Link>
        </p>

        <p className="mt-3 text-center text-xs text-slate-400">
          <Link href="/privacidade" className="hover:underline">
            Privacidade
          </Link>
          {" · "}
          <Link href="/termos" className="hover:underline">
            Termos
          </Link>
          {" · "}
          <Link href="/lgpd" className="hover:underline">
            LGPD
          </Link>
        </p>
      </div>

      <BookAssistant />
    </div>
  );
}
