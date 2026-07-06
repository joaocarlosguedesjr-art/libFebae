import { INSTITUTION_DEFAULTS, resolveLogoUrl } from "./institution";
import { prisma } from "@/lib/prisma";
import type { AppSettings } from "@/lib/app-settings.types";

export type { AppSettings } from "@/lib/app-settings.types";

const defaultCreate = {
  id: "default" as const,
  loanDaysDefault: INSTITUTION_DEFAULTS.loanDaysDefault,
  institutionName: INSTITUTION_DEFAULTS.institutionName,
  institutionAddress: INSTITUTION_DEFAULTS.institutionAddress,
  institutionEmail: INSTITUTION_DEFAULTS.institutionEmail,
  dpoEmail: INSTITUTION_DEFAULTS.dpoEmail,
  privacyPolicyVersion: INSTITUTION_DEFAULTS.privacyPolicyVersion,
  termsVersion: INSTITUTION_DEFAULTS.termsVersion,
  institutionLogoUrl: INSTITUTION_DEFAULTS.institutionLogoUrl,
};

export async function getAppSettings(): Promise<AppSettings> {
  const config = await prisma.appConfig.upsert({
    where: { id: "default" },
    update: {},
    create: defaultCreate,
  });

  return {
    loanDaysDefault: config.loanDaysDefault,
    institutionName: config.institutionName,
    institutionAddress: config.institutionAddress,
    institutionEmail: config.institutionEmail,
    dpoName: config.dpoName,
    dpoEmail: config.dpoEmail,
    privacyPolicyVersion: config.privacyPolicyVersion,
    termsVersion: config.termsVersion,
    institutionLogoUrl: resolveLogoUrl(config.institutionLogoUrl),
  };
}

export async function updateAppSettings(data: AppSettings) {
  return prisma.appConfig.upsert({
    where: { id: "default" },
    update: data,
    create: { id: "default", ...data },
  });
}

export async function applyInstitutionDefaults() {
  return prisma.appConfig.upsert({
    where: { id: "default" },
    update: {
      institutionName: INSTITUTION_DEFAULTS.institutionName,
      institutionAddress: INSTITUTION_DEFAULTS.institutionAddress,
      institutionEmail: INSTITUTION_DEFAULTS.institutionEmail,
      dpoEmail: INSTITUTION_DEFAULTS.dpoEmail,
      institutionLogoUrl: INSTITUTION_DEFAULTS.institutionLogoUrl,
    },
    create: defaultCreate,
  });
}
