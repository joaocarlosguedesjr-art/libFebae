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
  librarianRequiresApproval: boolean;
};

export type LegalConfig = AppSettings;
