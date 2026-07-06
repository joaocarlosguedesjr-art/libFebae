-- Solicitações de empréstimo com aprovação do bibliotecário

CREATE TYPE "LoanRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED');

CREATE TABLE "LoanRequest" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "bookId" TEXT NOT NULL,
    "status" "LoanRequestStatus" NOT NULL DEFAULT 'PENDING',
    "readerNote" TEXT,
    "adminNote" TEXT,
    "reviewedById" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "loanId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LoanRequest_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "LoanRequest_loanId_key" ON "LoanRequest"("loanId");
CREATE INDEX "LoanRequest_userId_idx" ON "LoanRequest"("userId");
CREATE INDEX "LoanRequest_status_idx" ON "LoanRequest"("status");
CREATE INDEX "LoanRequest_bookId_idx" ON "LoanRequest"("bookId");

ALTER TABLE "LoanRequest" ADD CONSTRAINT "LoanRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "LoanRequest" ADD CONSTRAINT "LoanRequest_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "Book"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "LoanRequest" ADD CONSTRAINT "LoanRequest_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "LoanRequest" ADD CONSTRAINT "LoanRequest_loanId_fkey" FOREIGN KEY ("loanId") REFERENCES "Loan"("id") ON DELETE SET NULL ON UPDATE CASCADE;
