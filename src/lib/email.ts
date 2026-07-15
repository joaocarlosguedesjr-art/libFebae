import { join } from "node:path";
import { existsSync } from "node:fs";
import nodemailer from "nodemailer";
import {
  buildAdminApprovalNotificationEmailContent,
  buildLoanConfirmationEmailContent,
  buildLoanReminderEmailContent,
  buildLoanReturnConfirmationEmailContent,
  buildPasswordResetEmailContent,
  buildVerificationEmailContent,
  CATALOG_HREF,
  getAppBaseUrl,
  getPublicBranding,
  LOGO_CID,
} from "@/lib/branding";
import { resolveLogoUrl, INSTITUTION_DEFAULTS } from "@/lib/institution";
import { formatDate } from "@/lib/utils";

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

async function getMailContext() {
  const branding = await getPublicBranding();
  const institution =
    process.env.SMTP_FROM_NAME ?? branding.institutionName ?? INSTITUTION_DEFAULTS.institutionName;
  const from = process.env.SMTP_FROM ?? process.env.SMTP_USER ?? "noreply@biblioteca.local";
  return { branding, institution, from };
}

async function sendInstitutionEmail(options: {
  to: string | string[];
  subject: string;
  text: string;
  html: string;
  devLabel: string;
  devDetails?: string[];
}) {
  const { branding, institution, from } = await getMailContext();
  const transporter = getTransporter();
  const recipients = Array.isArray(options.to) ? options.to.join(", ") : options.to;

  if (!transporter) {
    if (process.env.NODE_ENV === "development") {
      console.log(`\n========== ${options.devLabel} (DEV) ==========`);
      console.log(`Para: ${recipients}`);
      console.log(`Assunto: ${options.subject}`);
      options.devDetails?.forEach((line) => console.log(line));
      console.log("===============================================\n");
      return;
    }
    throw new Error(
      "Serviço de e-mail não configurado. Defina SMTP_HOST, SMTP_USER e SMTP_PASS.",
    );
  }

  await transporter.verify();

  const logoPath = getLogoFilePath(branding.institutionLogoUrl);
  const attachments = existsSync(logoPath)
    ? [{ filename: "feabe-logo.jpeg", path: logoPath, cid: LOGO_CID }]
    : [];

  await transporter.sendMail({
    from: `"${institution}" <${from}>`,
    to: options.to,
    subject: options.subject,
    text: options.text,
    html: options.html,
    attachments,
  });
}

export async function sendVerificationCodeEmail(to: string, code: string, name: string) {
  const { institution } = await getMailContext();
  const catalogUrl = `${getAppBaseUrl()}${CATALOG_HREF}?assistente=1`;
  const subject = `${code} — Código de verificação | ${institution}`;
  const { text, html } = buildVerificationEmailContent({
    name,
    code,
    institutionName: institution,
    catalogUrl,
  });

  await sendInstitutionEmail({
    to,
    subject,
    text,
    html,
    devLabel: "E-MAIL VERIFICAÇÃO",
    devDetails: [`Código: ${code}`],
  });
}

export async function sendPasswordResetCodeEmail(to: string, code: string, name: string) {
  const { institution } = await getMailContext();
  const loginUrl = `${getAppBaseUrl()}/login`;
  const subject = `${code} — Redefinição de senha | ${institution}`;
  const { text, html } = buildPasswordResetEmailContent({
    name,
    code,
    institutionName: institution,
    loginUrl,
  });

  await sendInstitutionEmail({
    to,
    subject,
    text,
    html,
    devLabel: "E-MAIL RESET",
    devDetails: [`Código: ${code}`],
  });
}

export async function sendLoanConfirmationEmail(options: {
  to: string;
  name: string;
  title: string;
  author: string;
  copyCode: string;
  loanDate: Date;
  dueDate: Date;
}) {
  const { institution } = await getMailContext();
  const baseUrl = getAppBaseUrl();
  const subject = `Empréstimo confirmado — ${options.title} | ${institution}`;
  const { text, html } = buildLoanConfirmationEmailContent({
    name: options.name,
    title: options.title,
    author: options.author,
    copyCode: options.copyCode,
    loanDateLabel: formatDate(options.loanDate),
    dueDateLabel: formatDate(options.dueDate),
    institutionName: institution,
    loansUrl: `${baseUrl}/emprestimos`,
  });

  await sendInstitutionEmail({
    to: options.to,
    subject,
    text,
    html,
    devLabel: "CONFIRMAÇÃO EMPRÉSTIMO",
    devDetails: [`Livro: ${options.title}`, `Devolução: ${formatDate(options.dueDate)}`],
  });
}

export async function sendLoanReturnConfirmationEmail(options: {
  to: string;
  name: string;
  title: string;
  author: string;
  copyCode: string;
  returnDate: Date;
}) {
  const { institution } = await getMailContext();
  const catalogUrl = `${getAppBaseUrl()}${CATALOG_HREF}`;
  const subject = `Devolução confirmada — ${options.title} | ${institution}`;
  const { text, html } = buildLoanReturnConfirmationEmailContent({
    name: options.name,
    title: options.title,
    author: options.author,
    copyCode: options.copyCode,
    returnDateLabel: formatDate(options.returnDate),
    institutionName: institution,
    catalogUrl,
  });

  await sendInstitutionEmail({
    to: options.to,
    subject,
    text,
    html,
    devLabel: "CONFIRMAÇÃO DEVOLUÇÃO",
    devDetails: [`Livro: ${options.title}`],
  });
}

export async function sendLoanReminderEmail(options: {
  to: string;
  name: string;
  title: string;
  dueDate: Date;
  renewUrl: string;
  returnUrl: string;
  loansUrl: string;
}) {
  const { institution } = await getMailContext();
  const subject = `Lembrete: faltam 2 dias — ${options.title} | ${institution}`;
  const { text, html } = buildLoanReminderEmailContent({
    name: options.name,
    title: options.title,
    dueDateLabel: formatDate(options.dueDate),
    institutionName: institution,
    renewUrl: options.renewUrl,
    returnUrl: options.returnUrl,
    loansUrl: options.loansUrl,
  });

  await sendInstitutionEmail({
    to: options.to,
    subject,
    text,
    html,
    devLabel: "LEMBRETE EMPRÉSTIMO",
    devDetails: [
      `Livro: ${options.title}`,
      `Renovar: ${options.renewUrl}`,
      `Solicitar devolução: ${options.returnUrl}`,
    ],
  });
}

export async function sendAdminApprovalNotificationEmail(options: {
  to: string[];
  summary: string;
  typeLabel: string;
  requestedByName: string;
  pendingCount: number;
}) {
  if (options.to.length === 0) return;

  const { institution } = await getMailContext();
  const approvalsUrl = `${getAppBaseUrl()}/aprovacoes`;
  const subject = `Aprovação pendente — ${institution}`;
  const { text, html } = buildAdminApprovalNotificationEmailContent({
    institutionName: institution,
    summary: options.summary,
    typeLabel: options.typeLabel,
    requestedByName: options.requestedByName,
    pendingCount: options.pendingCount,
    approvalsUrl,
  });

  await sendInstitutionEmail({
    to: options.to,
    subject,
    text,
    html,
    devLabel: "NOTIFICAÇÃO ADMIN",
    devDetails: [
      `Pendentes: ${options.pendingCount}`,
      `Resumo: ${options.summary}`,
      `Link: ${approvalsUrl}`,
    ],
  });
}

/** Envia e-mail sem interromper o fluxo principal em caso de falha. */
export function notifyInBackground(task: () => Promise<void>) {
  void task().catch((error) => {
    console.error("[email]", error instanceof Error ? error.message : error);
  });
}
