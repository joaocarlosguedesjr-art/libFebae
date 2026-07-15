import { INSTITUTION_DEFAULTS, resolveLogoUrl } from "@/lib/institution";
import { getAppBaseUrl } from "@/lib/app-url";
import { getAppSettings } from "@/lib/settings";

export const CATALOG_HREF = "/catalogo";
export const CATALOG_ASSISTANT_HREF = "/catalogo?assistente=1";
export const LOGO_CID = "institution-logo";

export type PublicBranding = {
  institutionName: string;
  institutionLogoUrl: string;
  catalogHref: string;
};

export { getAppBaseUrl };

export async function getPublicBranding(): Promise<PublicBranding> {
  const settings = await getAppSettings();
  return {
    institutionName: settings.institutionName,
    institutionLogoUrl: resolveLogoUrl(settings.institutionLogoUrl),
    catalogHref: CATALOG_HREF,
  };
}

export function buildVerificationEmailContent(options: {
  name: string;
  code: string;
  institutionName: string;
  catalogUrl: string;
}) {
  const { name, code, institutionName, catalogUrl } = options;

  const text = [
    institutionName,
    "",
    `Olá, ${name}!`,
    "",
    `Seu código de verificação para cadastro na biblioteca é:`,
    "",
    code,
    "",
    "Este código expira em 10 minutos.",
    "Se você não solicitou este cadastro, ignore este e-mail.",
    "",
    `Consultar acervo: ${catalogUrl}`,
  ].join("\n");

  const html = `
<!DOCTYPE html>
<html lang="pt-BR">
  <body style="margin:0;padding:0;background:#faf7f4;font-family:Arial,Helvetica,sans-serif;color:#1c1917;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#faf7f4;padding:24px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:520px;background:#fffaf5;border-radius:12px;border:1px solid #f0d4b8;overflow:hidden;">
            <tr>
              <td align="center" style="padding:28px 24px 20px;background:#fffaf5;border-bottom:3px solid #d4924f;">
                <img src="cid:${LOGO_CID}" alt="${institutionName}" width="240" style="display:block;max-width:240px;width:100%;height:auto;border:0;" />
              </td>
            </tr>
            <tr>
              <td style="padding:28px 24px 8px;background:#ffffff;">
                <p style="margin:0 0 8px;font-size:13px;font-weight:600;color:#a86224;text-transform:uppercase;letter-spacing:0.04em;">Verificação de cadastro</p>
                <p style="margin:0 0 16px;font-size:16px;line-height:1.5;color:#44403c;">Olá, <strong style="color:#1c1917;">${name}</strong>!</p>
                <p style="margin:0 0 20px;font-size:15px;line-height:1.5;color:#57534e;">
                  Use o código abaixo para confirmar seu cadastro na biblioteca <strong>${institutionName}</strong>:
                </p>
                <p style="margin:0 0 24px;text-align:center;font-size:32px;font-weight:700;letter-spacing:10px;color:#8b4f1f;">${code}</p>
                <p style="margin:0 0 8px;font-size:13px;color:#78716c;">Este código expira em <strong>10 minutos</strong>.</p>
                <p style="margin:0;font-size:13px;color:#78716c;">Se você não solicitou este cadastro, ignore este e-mail.</p>
              </td>
            </tr>
            <tr>
              <td align="center" style="padding:8px 24px 28px;background:#ffffff;">
                <a href="${catalogUrl}" style="display:inline-block;padding:12px 20px;background:#8b4f1f;color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;border-radius:8px;">
                  Consultar acervo com assistente
                </a>
              </td>
            </tr>
            <tr>
              <td style="padding:16px 24px;background:#fdf8f3;border-top:1px solid #f0d4b8;text-align:center;">
                <p style="margin:0;font-size:12px;color:#a8a29e;">${institutionName}</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`.trim();

  return { text, html };
}

export function buildPasswordResetEmailContent(options: {
  name: string;
  code: string;
  institutionName: string;
  loginUrl: string;
}) {
  const { name, code, institutionName, loginUrl } = options;

  const text = [
    institutionName,
    "",
    `Olá, ${name}!`,
    "",
    "Recebemos uma solicitação para redefinir sua senha na biblioteca.",
    "",
    `Seu código de verificação é:`,
    "",
    code,
    "",
    "Este código expira em 10 minutos.",
    "Se você não solicitou a redefinição, ignore este e-mail.",
    "",
    `Acessar login: ${loginUrl}`,
  ].join("\n");

  const html = `
<!DOCTYPE html>
<html lang="pt-BR">
  <body style="margin:0;padding:0;background:#faf7f4;font-family:Arial,Helvetica,sans-serif;color:#1c1917;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#faf7f4;padding:24px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:520px;background:#fffaf5;border-radius:12px;border:1px solid #f0d4b8;overflow:hidden;">
            <tr>
              <td align="center" style="padding:28px 24px 20px;background:#fffaf5;border-bottom:3px solid #d4924f;">
                <img src="cid:${LOGO_CID}" alt="${institutionName}" width="240" style="display:block;max-width:240px;width:100%;height:auto;border:0;" />
              </td>
            </tr>
            <tr>
              <td style="padding:28px 24px 8px;background:#ffffff;">
                <p style="margin:0 0 8px;font-size:13px;font-weight:600;color:#a86224;text-transform:uppercase;letter-spacing:0.04em;">Redefinição de senha</p>
                <p style="margin:0 0 16px;font-size:16px;line-height:1.5;color:#44403c;">Olá, <strong style="color:#1c1917;">${name}</strong>!</p>
                <p style="margin:0 0 20px;font-size:15px;line-height:1.5;color:#57534e;">
                  Use o código abaixo para confirmar a redefinição de senha em <strong>${institutionName}</strong>:
                </p>
                <p style="margin:0 0 24px;text-align:center;font-size:32px;font-weight:700;letter-spacing:10px;color:#8b4f1f;">${code}</p>
                <p style="margin:0 0 8px;font-size:13px;color:#78716c;">Este código expira em <strong>10 minutos</strong>.</p>
                <p style="margin:0;font-size:13px;color:#78716c;">Se você não solicitou, ignore este e-mail.</p>
              </td>
            </tr>
            <tr>
              <td align="center" style="padding:8px 24px 28px;background:#ffffff;">
                <a href="${loginUrl}" style="display:inline-block;padding:12px 20px;background:#8b4f1f;color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;border-radius:8px;">
                  Ir para o login
                </a>
              </td>
            </tr>
            <tr>
              <td style="padding:16px 24px;background:#fdf8f3;border-top:1px solid #f0d4b8;text-align:center;">
                <p style="margin:0;font-size:12px;color:#a8a29e;">${institutionName}</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`.trim();

  return { text, html };
}

export function buildLoanReminderEmailContent(options: {
  name: string;
  title: string;
  dueDateLabel: string;
  institutionName: string;
  renewUrl: string;
  returnUrl: string;
  loansUrl: string;
}) {
  const {
    name,
    title,
    dueDateLabel,
    institutionName,
    renewUrl,
    returnUrl,
    loansUrl,
  } = options;

  const text = [
    institutionName,
    "",
    `Olá, ${name}!`,
    "",
    `Faltam até 2 dias para o prazo de devolução do livro "${title}" (${dueDateLabel}).`,
    "Você pode estender o prazo pelo link abaixo (renovação disponível neste período).",
    "A devolução só é concluída quando o bibliotecário confirmar a entrega do livro.",
    "",
    `Estender prazo (renovar): ${renewUrl}`,
    `Solicitar devolução: ${returnUrl}`,
    `Meus empréstimos: ${loansUrl}`,
  ].join("\n");

  const html = `
<!DOCTYPE html>
<html lang="pt-BR">
  <body style="margin:0;padding:0;background:#faf7f4;font-family:Arial,Helvetica,sans-serif;color:#1c1917;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#faf7f4;padding:24px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#fffaf5;border-radius:12px;border:1px solid #f0d4b8;overflow:hidden;">
            <tr>
              <td align="center" style="padding:28px 24px 20px;background:#fffaf5;border-bottom:3px solid #d4924f;">
                <img src="cid:${LOGO_CID}" alt="${institutionName}" width="240" style="display:block;max-width:240px;width:100%;height:auto;border:0;" />
              </td>
            </tr>
            <tr>
              <td style="padding:28px 24px 16px;background:#ffffff;">
                <p style="margin:0 0 8px;font-size:13px;font-weight:600;color:#a86224;text-transform:uppercase;letter-spacing:0.04em;">Lembrete de empréstimo</p>
                <p style="margin:0 0 12px;font-size:16px;line-height:1.5;color:#44403c;">Olá, <strong style="color:#1c1917;">${name}</strong>!</p>
                <p style="margin:0 0 8px;font-size:15px;line-height:1.5;color:#57534e;">
                  Faltam <strong>até 2 dias</strong> para a devolução do livro <strong>${title}</strong>
                  (prazo: <strong>${dueDateLabel}</strong>).
                </p>
                <p style="margin:0 0 20px;font-size:13px;color:#78716c;">
                  Clique no botão abaixo para estender o prazo no sistema.
                  A devolução física só é concluída quando o bibliotecário confirmar a entrega.
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:0 24px 24px;background:#ffffff;">
                <a href="${renewUrl}" style="display:block;padding:12px 20px;margin:0 0 10px;background:#8b4f1f;color:#ffffff;text-decoration:none;text-align:center;font-size:14px;font-weight:600;border-radius:8px;">
                  Estender prazo (renovar)
                </a>
                <a href="${returnUrl}" style="display:block;padding:12px 20px;margin:0 0 10px;background:#ffffff;color:#8b4f1f;text-decoration:none;text-align:center;font-size:14px;font-weight:600;border-radius:8px;border:1px solid #d6b08a;">
                  Solicitar devolução
                </a>
                <a href="${loansUrl}" style="display:block;padding:8px 16px;color:#8b4f1f;text-decoration:none;text-align:center;font-size:13px;">
                  Ver meus empréstimos
                </a>
              </td>
            </tr>
            <tr>
              <td style="padding:16px 24px;background:#fdf8f3;border-top:1px solid #f0d4b8;text-align:center;">
                <p style="margin:0;font-size:12px;color:#a8a29e;">${institutionName}</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`.trim();

  return { text, html };
}

function emailShell(institutionName: string, eyebrow: string, bodyHtml: string, ctaHtml?: string) {
  return `
<!DOCTYPE html>
<html lang="pt-BR">
  <body style="margin:0;padding:0;background:#faf7f4;font-family:Arial,Helvetica,sans-serif;color:#1c1917;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#faf7f4;padding:24px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#fffaf5;border-radius:12px;border:1px solid #f0d4b8;overflow:hidden;">
            <tr>
              <td align="center" style="padding:28px 24px 20px;background:#fffaf5;border-bottom:3px solid #d4924f;">
                <img src="cid:${LOGO_CID}" alt="${institutionName}" width="240" style="display:block;max-width:240px;width:100%;height:auto;border:0;" />
              </td>
            </tr>
            <tr>
              <td style="padding:28px 24px 16px;background:#ffffff;">
                <p style="margin:0 0 8px;font-size:13px;font-weight:600;color:#a86224;text-transform:uppercase;letter-spacing:0.04em;">${eyebrow}</p>
                ${bodyHtml}
              </td>
            </tr>
            ${ctaHtml ? `<tr><td style="padding:0 24px 24px;background:#ffffff;">${ctaHtml}</td></tr>` : ""}
            <tr>
              <td style="padding:16px 24px;background:#fdf8f3;border-top:1px solid #f0d4b8;text-align:center;">
                <p style="margin:0;font-size:12px;color:#a8a29e;">${institutionName}</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`.trim();
}

function ctaButton(href: string, label: string) {
  return `<a href="${href}" style="display:block;padding:12px 20px;margin:0 0 10px;background:#8b4f1f;color:#ffffff;text-decoration:none;text-align:center;font-size:14px;font-weight:600;border-radius:8px;">${label}</a>`;
}

export function buildLoanConfirmationEmailContent(options: {
  name: string;
  title: string;
  author: string;
  copyCode: string;
  dueDateLabel: string;
  loanDateLabel: string;
  institutionName: string;
  loansUrl: string;
}) {
  const { name, title, author, copyCode, dueDateLabel, loanDateLabel, institutionName, loansUrl } =
    options;

  const text = [
    institutionName,
    "",
    `Olá, ${name}!`,
    "",
    "Seu empréstimo foi registrado com sucesso.",
    "",
    `Obra: ${title}`,
    `Autor: ${author}`,
    `Exemplar: ${copyCode}`,
    `Data do empréstimo: ${loanDateLabel}`,
    `Devolução prevista: ${dueDateLabel}`,
    "",
    `Acompanhe em: ${loansUrl}`,
  ].join("\n");

  const bodyHtml = `
    <p style="margin:0 0 12px;font-size:16px;line-height:1.5;color:#44403c;">Olá, <strong style="color:#1c1917;">${name}</strong>!</p>
    <p style="margin:0 0 16px;font-size:15px;line-height:1.5;color:#57534e;">
      Seu empréstimo na <strong>${institutionName}</strong> foi confirmado.
    </p>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:0 0 16px;font-size:14px;color:#44403c;">
      <tr><td style="padding:4px 0;color:#78716c;width:140px;">Obra</td><td style="padding:4px 0;"><strong>${title}</strong></td></tr>
      <tr><td style="padding:4px 0;color:#78716c;">Autor</td><td style="padding:4px 0;">${author}</td></tr>
      <tr><td style="padding:4px 0;color:#78716c;">Exemplar</td><td style="padding:4px 0;">${copyCode}</td></tr>
      <tr><td style="padding:4px 0;color:#78716c;">Empréstimo</td><td style="padding:4px 0;">${loanDateLabel}</td></tr>
      <tr><td style="padding:4px 0;color:#78716c;">Devolução</td><td style="padding:4px 0;"><strong>${dueDateLabel}</strong></td></tr>
    </table>
  `;

  const html = emailShell(
    institutionName,
    "Confirmação de empréstimo",
    bodyHtml,
    ctaButton(loansUrl, "Ver meus empréstimos"),
  );

  return { text, html };
}

export function buildLoanReturnConfirmationEmailContent(options: {
  name: string;
  title: string;
  author: string;
  copyCode: string;
  returnDateLabel: string;
  institutionName: string;
  catalogUrl: string;
}) {
  const { name, title, author, copyCode, returnDateLabel, institutionName, catalogUrl } = options;

  const text = [
    institutionName,
    "",
    `Olá, ${name}!`,
    "",
    "A devolução do seu empréstimo foi confirmada pelo bibliotecário.",
    "",
    `Obra: ${title}`,
    `Autor: ${author}`,
    `Exemplar: ${copyCode}`,
    `Data da devolução: ${returnDateLabel}`,
    "",
    `Consultar acervo: ${catalogUrl}`,
  ].join("\n");

  const bodyHtml = `
    <p style="margin:0 0 12px;font-size:16px;line-height:1.5;color:#44403c;">Olá, <strong style="color:#1c1917;">${name}</strong>!</p>
    <p style="margin:0 0 16px;font-size:15px;line-height:1.5;color:#57534e;">
      A devolução do exemplar abaixo foi registrada na <strong>${institutionName}</strong>.
    </p>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:0 0 16px;font-size:14px;color:#44403c;">
      <tr><td style="padding:4px 0;color:#78716c;width:140px;">Obra</td><td style="padding:4px 0;"><strong>${title}</strong></td></tr>
      <tr><td style="padding:4px 0;color:#78716c;">Autor</td><td style="padding:4px 0;">${author}</td></tr>
      <tr><td style="padding:4px 0;color:#78716c;">Exemplar</td><td style="padding:4px 0;">${copyCode}</td></tr>
      <tr><td style="padding:4px 0;color:#78716c;">Devolvido em</td><td style="padding:4px 0;"><strong>${returnDateLabel}</strong></td></tr>
    </table>
  `;

  const html = emailShell(
    institutionName,
    "Confirmação de devolução",
    bodyHtml,
    ctaButton(catalogUrl, "Consultar acervo"),
  );

  return { text, html };
}

export function buildAdminApprovalNotificationEmailContent(options: {
  institutionName: string;
  summary: string;
  typeLabel: string;
  requestedByName: string;
  pendingCount: number;
  approvalsUrl: string;
}) {
  const { institutionName, summary, typeLabel, requestedByName, pendingCount, approvalsUrl } =
    options;

  const text = [
    institutionName,
    "",
    "Nova solicitação aguardando sua aprovação.",
    "",
    `Tipo: ${typeLabel}`,
    `Resumo: ${summary}`,
    `Solicitante: ${requestedByName}`,
    `Total pendente: ${pendingCount}`,
    "",
    `Revisar: ${approvalsUrl}`,
  ].join("\n");

  const bodyHtml = `
    <p style="margin:0 0 16px;font-size:15px;line-height:1.5;color:#57534e;">
      Há <strong>${pendingCount}</strong> solicitação(ões) pendente(s) de aprovação.
    </p>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:0 0 16px;font-size:14px;color:#44403c;background:#fdf8f3;border-radius:8px;">
      <tr><td style="padding:12px 16px;">
        <p style="margin:0 0 4px;font-size:12px;color:#a86224;text-transform:uppercase;">${typeLabel}</p>
        <p style="margin:0 0 8px;font-size:15px;font-weight:600;color:#1c1917;">${summary}</p>
        <p style="margin:0;font-size:13px;color:#78716c;">Solicitado por ${requestedByName}</p>
      </td></tr>
    </table>
  `;

  const html = emailShell(
    institutionName,
    "Aprovação pendente",
    bodyHtml,
    ctaButton(approvalsUrl, "Abrir fila de aprovações"),
  );

  return { text, html };
}
