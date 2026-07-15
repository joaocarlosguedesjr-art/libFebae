import { getAppSettings, type AppSettings } from "@/lib/settings";
import { INSTITUTION_DEFAULTS } from "@/lib/institution";
import { prisma } from "@/lib/prisma";
import { formatCpf, maskCpf } from "@/lib/cpf";
import {
  DATA_SUBJECT_REQUEST_LABELS,
  REQUEST_STATUS_LABELS,
} from "@/lib/lgpd.constants";

export {
  DATA_SUBJECT_REQUEST_LABELS,
  REQUEST_STATUS_LABELS,
  maskCpf,
  formatCpf,
};

export const DEFAULT_PRIVACY_VERSION = "1.0";
export const DEFAULT_TERMS_VERSION = "1.0";

export type LegalConfig = AppSettings;

export async function getLegalConfig(): Promise<LegalConfig> {
  try {
    return await getAppSettings();
  } catch {
    return {
      loanDaysDefault: INSTITUTION_DEFAULTS.loanDaysDefault,
      institutionName: INSTITUTION_DEFAULTS.institutionName,
      institutionAddress: INSTITUTION_DEFAULTS.institutionAddress,
      institutionEmail: INSTITUTION_DEFAULTS.institutionEmail,
      dpoName: null,
      dpoEmail: INSTITUTION_DEFAULTS.dpoEmail,
      privacyPolicyVersion: DEFAULT_PRIVACY_VERSION,
      termsVersion: DEFAULT_TERMS_VERSION,
      institutionLogoUrl: INSTITUTION_DEFAULTS.institutionLogoUrl,
      librarianRequiresApproval: true,
    };
  }
}

export function hasValidConsent(
  user: {
    privacyAcceptedAt: Date | null;
    privacyPolicyVersion: string | null;
    termsAcceptedAt: Date | null;
    termsVersion: string | null;
  },
  config: Pick<LegalConfig, "privacyPolicyVersion" | "termsVersion">
): boolean {
  return (
    !!user.privacyAcceptedAt &&
    !!user.termsAcceptedAt &&
    user.privacyPolicyVersion === config.privacyPolicyVersion &&
    user.termsVersion === config.termsVersion
  );
}

export async function userNeedsConsent(userId: string): Promise<boolean> {
  const [user, config] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        privacyAcceptedAt: true,
        privacyPolicyVersion: true,
        termsAcceptedAt: true,
        termsVersion: true,
      },
    }),
    getLegalConfig(),
  ]);

  if (!user) return true;
  return !hasValidConsent(user, config);
}

export async function recordSelfConsent(userId: string) {
  const config = await getLegalConfig();
  const now = new Date();

  return prisma.user.update({
    where: { id: userId },
    data: {
      privacyAcceptedAt: now,
      privacyPolicyVersion: config.privacyPolicyVersion,
      termsAcceptedAt: now,
      termsVersion: config.termsVersion,
      consentMethod: "SELF_ACCEPTANCE",
    },
  });
}

export async function recordAdminConsent(userId: string, adminId: string) {
  const config = await getLegalConfig();
  const now = new Date();

  return prisma.user.update({
    where: { id: userId },
    data: {
      privacyAcceptedAt: now,
      privacyPolicyVersion: config.privacyPolicyVersion,
      termsAcceptedAt: now,
      termsVersion: config.termsVersion,
      consentRecordedById: adminId,
      consentMethod: "ADMIN_REGISTRATION",
    },
  });
}
