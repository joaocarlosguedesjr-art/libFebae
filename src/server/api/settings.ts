import { auth } from "@/lib/auth";
import { getAppSettings, updateAppSettings } from "@/lib/settings";
import { appConfigSchema } from "@/lib/validations";
import { denyUnlessStaff, maybeQueueApproval } from "@/lib/staff-access";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  const denied = denyUnlessStaff(session);
  if (denied) return denied;

  const settings = await getAppSettings();
  return NextResponse.json(settings);
}

export async function PATCH(request: Request) {
  const session = await auth();
  const denied = denyUnlessStaff(session);
  if (denied) return denied;

  const body = await request.json();
  const parsed = appConfigSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Dados inválidos" },
      { status: 400 }
    );
  }

  const { institutionAddress, dpoName, librarianRequiresApproval, ...rest } = parsed.data;
  const current = await getAppSettings();

  const settingsData = {
    ...rest,
    institutionAddress: institutionAddress ?? null,
    dpoName: dpoName ?? null,
    librarianRequiresApproval:
      session!.user.role === "ADMIN"
        ? (librarianRequiresApproval ?? current.librarianRequiresApproval)
        : current.librarianRequiresApproval,
  };

  if (session!.user.role === "ADMIN") {
    const settings = await updateAppSettings(settingsData);
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
      librarianRequiresApproval: settings.librarianRequiresApproval,
    });
  }

  const queued = await maybeQueueApproval({
    session: session!,
    type: "SETTINGS_UPDATE",
    payload: settingsData,
    summary: "Alterar configurações da instituição",
  });
  if (queued) return queued;

  const settings = await updateAppSettings(settingsData);
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
    librarianRequiresApproval: settings.librarianRequiresApproval,
  });
}
