-- Numeração sequencial de obra (100) + exemplar (100.1)

ALTER TABLE "Book" ADD COLUMN "workNumber" INTEGER;

CREATE UNIQUE INDEX "Book_workNumber_key" ON "Book"("workNumber");
