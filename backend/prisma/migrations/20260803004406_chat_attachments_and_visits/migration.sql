-- CreateEnum
CREATE TYPE "MessageAttachmentType" AS ENUM ('IMAGE', 'VIDEO', 'DOCUMENT');

-- AlterTable
ALTER TABLE "messages" ADD COLUMN     "attachmentName" TEXT,
ADD COLUMN     "attachmentType" "MessageAttachmentType",
ADD COLUMN     "attachmentUrl" TEXT,
ALTER COLUMN "body" DROP NOT NULL;

-- CreateTable
CREATE TABLE "visits" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "path" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "visits_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "visits_createdAt_idx" ON "visits"("createdAt");

-- CreateIndex
CREATE INDEX "visits_sessionId_idx" ON "visits"("sessionId");
