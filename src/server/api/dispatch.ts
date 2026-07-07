import { NextResponse } from "next/server";
import * as booksList from "@/server/api/books-list";
import * as booksId from "@/server/api/books-id";
import * as copies from "@/server/api/copies";
import * as loansList from "@/server/api/loans-list";
import * as loansReturn from "@/server/api/loans-return";
import * as loanRequestsList from "@/server/api/loan-requests-list";
import * as loanRequestsId from "@/server/api/loan-requests-id";
import * as stats from "@/server/api/stats";
import * as chat from "@/server/api/chat";
import * as branding from "@/server/api/branding";
import * as settings from "@/server/api/settings";
import * as usersList from "@/server/api/users-list";
import * as usersMe from "@/server/api/users-me";
import * as usersVerifySend from "@/server/api/users-verify-send";
import * as usersVerifyResend from "@/server/api/users-verify-resend";
import * as usersVerifyConfirm from "@/server/api/users-verify-confirm";
import * as cadastroSend from "@/server/api/cadastro-send";
import * as cadastroResend from "@/server/api/cadastro-resend";
import * as cadastroConfirm from "@/server/api/cadastro-confirm";
import * as lgpdRequestsList from "@/server/api/lgpd-requests-list";
import * as lgpdRequestsId from "@/server/api/lgpd-requests-id";
import * as privacyAccept from "@/server/api/privacy-accept";

type RouteContext = { params: Promise<Record<string, string>> };

function ctx(id: string, key = "id"): RouteContext {
  return { params: Promise.resolve({ [key]: id }) };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function asParams(context: RouteContext): any {
  return context;
}

function notFound() {
  return NextResponse.json({ error: "Rota não encontrada" }, { status: 404 });
}

function methodNotAllowed() {
  return NextResponse.json({ error: "Método não permitido" }, { status: 405 });
}

export async function dispatchApi(
  request: Request,
  segments: string[] | undefined,
): Promise<Response> {
  const path = segments ?? [];
  const method = request.method;

  if (path.length === 0) return notFound();

  const [root, second, third] = path;

  if (root === "books" && path.length === 1) {
    if (method === "GET") return booksList.GET(request);
    if (method === "POST") return booksList.POST(request);
    return methodNotAllowed();
  }

  if (root === "books" && path.length === 2) {
    if (method === "GET") return booksId.GET(request, asParams(ctx(second)));
    if (method === "PUT") return booksId.PUT(request, asParams(ctx(second)));
    if (method === "DELETE") return booksId.DELETE(request, asParams(ctx(second)));
    return methodNotAllowed();
  }

  if (root === "copies" && path.length === 1) {
    if (method === "GET") return copies.GET(request);
    if (method === "POST") return copies.POST(request);
    return methodNotAllowed();
  }

  if (root === "loans" && path.length === 1) {
    if (method === "GET") return loansList.GET(request);
    if (method === "POST") return loansList.POST(request);
    return methodNotAllowed();
  }

  if (root === "loans" && second && third === "return" && path.length === 3) {
    if (method === "POST") return loansReturn.POST(request, asParams(ctx(second)));
    return methodNotAllowed();
  }

  if (root === "loan-requests" && path.length === 1) {
    if (method === "GET") return loanRequestsList.GET(request);
    if (method === "POST") return loanRequestsList.POST(request);
    return methodNotAllowed();
  }

  if (root === "loan-requests" && path.length === 2) {
    if (method === "PATCH") return loanRequestsId.PATCH(request, asParams(ctx(second)));
    if (method === "DELETE") return loanRequestsId.DELETE(request, asParams(ctx(second)));
    return methodNotAllowed();
  }

  if (root === "stats" && path.length === 1) {
    if (method === "GET") return stats.GET();
    return methodNotAllowed();
  }

  if (root === "chat" && path.length === 1) {
    if (method === "POST") return chat.POST(request);
    return methodNotAllowed();
  }

  if (root === "branding" && path.length === 1) {
    if (method === "GET") return branding.GET(request);
    return methodNotAllowed();
  }

  if (root === "settings" && path.length === 1) {
    if (method === "GET") return settings.GET();
    if (method === "PATCH") return settings.PATCH(request);
    return methodNotAllowed();
  }

  if (root === "users" && second === "me" && path.length === 2) {
    if (method === "GET") return usersMe.GET();
    if (method === "PATCH") return usersMe.PATCH(request);
    return methodNotAllowed();
  }

  if (root === "users" && second === "verify-email" && third === "send" && path.length === 3) {
    if (method === "POST") return usersVerifySend.POST(request);
    return methodNotAllowed();
  }

  if (root === "users" && second === "verify-email" && third === "resend" && path.length === 3) {
    if (method === "POST") return usersVerifyResend.POST(request);
    return methodNotAllowed();
  }

  if (root === "users" && second === "verify-email" && third === "confirm" && path.length === 3) {
    if (method === "POST") return usersVerifyConfirm.POST(request);
    return methodNotAllowed();
  }

  if (root === "users" && path.length === 1) {
    if (method === "GET") return usersList.GET(request);
    if (method === "POST") return usersList.POST();
    return methodNotAllowed();
  }

  if (root === "cadastro" && second === "send-code" && path.length === 2) {
    if (method === "POST") return cadastroSend.POST(request);
    return methodNotAllowed();
  }

  if (root === "cadastro" && second === "resend-code" && path.length === 2) {
    if (method === "POST") return cadastroResend.POST(request);
    return methodNotAllowed();
  }

  if (root === "cadastro" && second === "confirm" && path.length === 2) {
    if (method === "POST") return cadastroConfirm.POST(request);
    return methodNotAllowed();
  }

  if (root === "lgpd" && second === "requests" && path.length === 2) {
    if (method === "GET") return lgpdRequestsList.GET();
    if (method === "POST") return lgpdRequestsList.POST(request);
    return methodNotAllowed();
  }

  if (root === "lgpd" && second === "requests" && path.length === 3) {
    if (method === "PATCH") return lgpdRequestsId.PATCH(request, asParams(ctx(third!)));
    return methodNotAllowed();
  }

  if (root === "privacy" && second === "accept" && path.length === 2) {
    if (method === "POST") return privacyAccept.POST();
    return methodNotAllowed();
  }

  return notFound();
}
