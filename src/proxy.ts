import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/lib/auth.config";

const adminPaths = [
  "/usuarios",
  "/acervo/novo",
  "/emprestimos/novo",
  "/emprestimos/solicitacoes",
  "/lgpd/solicitacoes",
  "/configuracoes",
];

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  if (req.nextUrl.pathname === "/") {
    const target = req.auth ? "/dashboard" : "/catalogo";
    return NextResponse.redirect(new URL(target, req.nextUrl.origin));
  }

  if (!req.auth) {
    const loginUrl = new URL("/login", req.nextUrl.origin);
    loginUrl.searchParams.set("callbackUrl", req.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  const isAdminRoute = adminPaths.some((path) =>
    req.nextUrl.pathname.startsWith(path)
  );

  if (isAdminRoute && req.auth.user?.role !== "ADMIN") {
    return NextResponse.redirect(new URL("/dashboard", req.nextUrl.origin));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/",
    "/dashboard/:path*",
    "/acervo/:path*",
    "/emprestimos/:path*",
    "/usuarios/:path*",
    "/meus-dados/:path*",
    "/lgpd/:path*",
    "/configuracoes/:path*",
    "/privacidade/aceite",
  ],
};
