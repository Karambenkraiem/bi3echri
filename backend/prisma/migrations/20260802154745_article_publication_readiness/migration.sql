-- AlterTable
ALTER TABLE "articles" ADD COLUMN     "notReadyReason" TEXT,
ADD COLUMN     "readyForPublication" BOOLEAN NOT NULL DEFAULT true;

-- CreateIndex
CREATE INDEX "articles_readyForPublication_idx" ON "articles"("readyForPublication");
