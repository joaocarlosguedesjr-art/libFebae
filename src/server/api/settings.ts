import { auth } from "@/lib/auth";
import { getAppSettings, updateAppSettings } from "@/lib/settings";
import { appConfigSchema } from "@/lib/validations";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();

  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }

  const settings = await getAppSettings();
  return NextResponse.json(settings);
}

export async function PATCH(request: Request) {
  const session = await auth();

  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }

  const body = await request.json();
  const parsed = appConfigSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Dados inválidos" },
      { status: 400 }
    );
  }

  const { institutionAddress, dpoName, ...rest } = parsed.data;

  const settings = await updateAppSettings({
    ...rest,
    institutionAddress: institutionAddress ?? null,
    dpoName: dpoName ?? null,
  });

  return NextResponse.json({
    loanDaysDefault: settings.loanDaysDefault,
    institutionName: settings.institutionName,
    institutionAddress: settings.institutionAddress,
    institutionEmail: settings.institutionEmail,
    dpoName: settings.dpoName,
    dpoEmail: settings.dpoEmail,
    privacyPolicyVersion: settings.privacyPolicyVersion,
    termsVersion: settings.termsVersion,
    institutionLogoUrl: settings.institutionLogoUrl,
  });
}
