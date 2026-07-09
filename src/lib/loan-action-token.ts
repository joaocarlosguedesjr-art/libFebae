import { createHmac, timingSafeEqual } from "node:crypto";

type LoanEmailAction = "renew" | "request-return";

type TokenPayload = {
  loanId: string;
  userId: string;
  action: LoanEmailAction;
  exp: number;
};

const TOKEN_TTL_MS = 3 * 24 * 60 * 60 * 1000;

function getSecret() {
  return process.env.AUTH_SECRET ?? "dev-secret";
}

function encode(input: string) {
  return Buffer.from(input).toString("base64url");
}

function decode(input: string) {
  return Buffer.from(input, "base64url").toString("utf-8");
}

function sign(content: string) {
  return createHmac("sha256", getSecret()).update(content).digest("base64url");
}

export function createLoanActionToken(data: {
  loanId: string;
  userId: string;
  action: LoanEmailAction;
}) {
  const payload: TokenPayload = {
    ...data,
    exp: Date.now() + TOKEN_TTL_MS,
  };
  const encoded = encode(JSON.stringify(payload));
  const signature = sign(encoded);
  return `${encoded}.${signature}`;
}

export function verifyLoanActionToken(token: string): TokenPayload {
  const [encoded, signature] = token.split(".");
  if (!encoded || !signature) {
    throw new Error("Token inválido");
  }

  const expected = sign(encoded);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    throw new Error("Assinatura inválida");
  }

  const payload = JSON.parse(decode(encoded)) as TokenPayload;
  if (!payload.loanId || !payload.userId || !payload.action || !payload.exp) {
    throw new Error("Token incompleto");
  }
  if (payload.exp < Date.now()) {
    throw new Error("Token expirado");
  }
  return payload;
}
