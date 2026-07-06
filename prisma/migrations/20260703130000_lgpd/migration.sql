-- CreateEnum
CREATE TYPE "ConsentMethod" AS ENUM ('ADMIN_REGISTRATION', 'SELF_ACCEPTANCE');

-- CreateEnum
CREATE TYPE "DataSubjectRequestType" AS ENUM ('ACCESS', 'CORRECTION', 'DELETION', 'PORTABILITY', 'REVOCATION', 'INFORMATION');

-- CreateEnum
CREATE TYPE "DataSubjectRequestStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'REJECTED');

-- AlterTable
ALTER TABLE "User" ADD COLUMN "privacyAcceptedAt" TIMESTAMP(3),
ADD COLUMN "privacyPolicyVersion" TEXT,
ADD COLUMN "termsAcceptedAt" TIMESTAMP(3),
ADD COLUMN "termsVersion" TEXT,
ADD COLUMN "consentRecordedById" TEXT,
ADD COLUMN "consentMethod" "ConsentMethod";

-- AlterTable
ALTER TABLE "AppConfig" ADD COLUMN "institutionName" TEXT NOT NULL DEFAULT 'Centro Espírita',
ADD COLUMN "institutionAddress" TEXT,
ADD COLUMN "institutionEmail" TEXT NOT NULL DEFAULT 'privacidade@biblioteca.local',
ADD COLUMN "dpoName" TEXT,
ADD COLUMN "dpoEmail" TEXT NOT NULL DEFAULT 'privacidade@biblioteca.local',
ADD COLUMN "privacyPolicyVersion" TEXT NOT NULL DEFAULT '1.0',
ADD COLUMN "termsVersion" TEXT NOT NULL DEFAULT '1.0';

-- CreateTable
CREATE TABLE "DataSubjectRequest" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "DataSubjectRequestType" NOT NULL,
    "status" "DataSubjectRequestStatus" NOT NULL DEFAULT 'PENDING',
    "description" TEXT,
    "response" TEXT,
    "handledById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DataSubjectRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DataSubjectRequest_userId_idx" ON "DataSubjectRequest"("userId");

-- CreateIndex
CREATE INDEX "DataSubjectRequest_status_idx" ON "DataSubjectRequest"("status");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_consentRecordedById_fkey" FOREIGN KEY ("consentRecordedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DataSubjectRequest" ADD CONSTRAINT "DataSubjectRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
