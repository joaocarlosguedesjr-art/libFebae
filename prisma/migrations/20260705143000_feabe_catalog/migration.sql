-- FEABE: numeração catalográfica por autor espiritual + ordem legada na estante

ALTER TABLE "Book" ADD COLUMN "catalogNumber" TEXT;
ALTER TABLE "Book" ADD COLUMN "authorGroup" TEXT;

ALTER TABLE "Copy" ADD COLUMN "legacyNumber" INTEGER;
ALTER TABLE "Copy" ADD COLUMN "shelfOrder" INTEGER;

CREATE UNIQUE INDEX "Book_catalogNumber_key" ON "Book"("catalogNumber");
CREATE INDEX "Copy_legacyNumber_idx" ON "Copy"("legacyNumber");
CREATE INDEX "Copy_shelfOrder_idx" ON "Copy"("shelfOrder");
