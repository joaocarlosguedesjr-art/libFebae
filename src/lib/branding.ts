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
