import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma";
import { INSTITUTION_DEFAULTS } from "../src/lib/institution";

const prisma = new PrismaClient();

async function main() {
  await prisma.appConfig.upsert({
    where: { id: "default" },
    update: {
      institutionName: INSTITUTION_DEFAULTS.institutionName,
      institutionAddress: INSTITUTION_DEFAULTS.institutionAddress,
      institutionEmail: INSTITUTION_DEFAULTS.institutionEmail,
      dpoEmail: INSTITUTION_DEFAULTS.dpoEmail,
      institutionLogoUrl: INSTITUTION_DEFAULTS.institutionLogoUrl,
    },
    create: {
      id: "default",
      loanDaysDefault: INSTITUTION_DEFAULTS.loanDaysDefault,
      privacyPolicyVersion: INSTITUTION_DEFAULTS.privacyPolicyVersion,
      termsVersion: INSTITUTION_DEFAULTS.termsVersion,
      institutionName: INSTITUTION_DEFAULTS.institutionName,
      institutionAddress: INSTITUTION_DEFAULTS.institutionAddress,
      institutionEmail: INSTITUTION_DEFAULTS.institutionEmail,
      dpoEmail: INSTITUTION_DEFAULTS.dpoEmail,
      institutionLogoUrl: INSTITUTION_DEFAULTS.institutionLogoUrl,
    },
  });

  console.log("Instituição configurada:");
  console.log(`  ${INSTITUTION_DEFAULTS.institutionName}`);
  console.log(`  ${INSTITUTION_DEFAULTS.institutionAddress}`);
  console.log(`  ${INSTITUTION_DEFAULTS.institutionEmail}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
