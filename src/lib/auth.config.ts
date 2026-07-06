import type { NextAuthConfig } from "next-auth";

export const authConfig: NextAuthConfig = {
  trustHost: true,
  secret: process.env.AUTH_SECRET,
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [],
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isProtected =
        nextUrl.pathname.startsWith("/dashboard") ||
        nextUrl.pathname.startsWith("/acervo") ||
        nextUrl.pathname.startsWith("/emprestimos") ||
        nextUrl.pathname.startsWith("/usuarios") ||
        nextUrl.pathname.startsWith("/meus-dados") ||
        nextUrl.pathname.startsWith("/lgpd") ||
        nextUrl.pathname.startsWith("/configuracoes") ||
        nextUrl.pathname === "/privacidade/aceite";

      if (!isProtected) return true;
      return isLoggedIn;
    },
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as "ADMIN" | "READER";
      }
      return session;
    },
  },
};
