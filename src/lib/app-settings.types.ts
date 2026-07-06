export type AppSettings = {
  loanDaysDefault: number;
  institutionName: string;
  institutionAddress: string | null;
  institutionEmail: string;
  dpoName: string | null;
  dpoEmail: string;
  privacyPolicyVersion: string;
  termsVersion: string;
  institutionLogoUrl: string;
};

export type LegalConfig = AppSettings;
