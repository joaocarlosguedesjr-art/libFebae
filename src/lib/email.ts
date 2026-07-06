import { join } from "node:path";
import { existsSync } from "node:fs";
import nodemailer from "nodemailer";
import {
  buildVerificationEmailContent,
  getAppBaseUrl,
  getPublicBranding,
  LOGO_CID,
} from "@/lib/branding";
import { resolveLogoUrl, INSTITUTION_DEFAULTS } from "@/lib/institution";

function getLogoFilePath(logoUrl?: string | null): string {
  const publicPath = resolveLogoUrl(logoUrl).replace(/^\//, "");
  return join(process.cwd(), "public", publicPath);
}

function getSmtpAuth() {
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASS?.replace(/\s/g, "").trim();
  if (!user || !pass) return null;
  return { user, pass };
}

function getTransporter() {
  const auth = getSmtpAuth();
  if (!auth) return null;

  const host = process.env.SMTP_HOST?.trim() ?? "smtp.gmail.com";

  if (host === "smtp.gmail.com") {
    const port = Number(process.env.SMTP_PORT ?? 587);
    const secure = process.env.SMTP_SECURE === "true" || port === 465;
    return nodemailer.createTransport({
      host,
      port,
      secure,
      requireTLS: !secure,
      auth,
    });
  }

  return nodemailer.createTransport({
    host,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: process.env.SMTP_SECURE === "true",
    auth,
  });
}

export async function sendVerificationCodeEmail(to: string, code: string, name: string) {
  const branding = await getPublicBranding();
  const institution =
    process.env.SMTP_FROM_NAME ?? branding.institutionName ?? INSTITUTION_DEFAULTS.institutionName;
  const from =
    process.env.SMTP_FROM ?? process.env.SMTP_USER ?? "noreply@biblioteca.local";
  const catalogUrl = `${getAppBaseUrl()}${branding.catalogHref}?assistente=1`;

  const subject = `${code} — Código de verificação | ${institution}`;
  const { text, html } = buildVerificationEmailContent({
    name,
    code,
    institutionName: institution,
    catalogUrl,
  });

  const transporter = getTransporter();

  if (!transporter) {
    if (process.env.NODE_ENV === "development") {
      console.log("\n========== E-MAIL (DEV — SMTP não configurado) ==========");
      console.log(`Para: ${to}`);
      console.log(`Código: ${code}`);
      console.log("=========================================================\n");
      return;
    }
    throw new Error(
      "Serviço de e-mail não configurado. Defina SMTP_HOST, SMTP_USER e SMTP_PASS."
    );
  }

  await transporter.verify();

  const logoPath = getLogoFilePath(branding.institutionLogoUrl);
  const attachments = existsSync(logoPath)
    ? [
        {
          filename: "feabe-logo.jpeg",
          path: logoPath,
          cid: LOGO_CID,
        },
      ]
    : [];

  await transporter.sendMail({
    from: `"${institution}" <${from}>`,
    to,
    subject,
    text,
    html,
    attachments,
  });
}
