-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('ACHAT_ARTICLE', 'VENTE_ARTICLE', 'CANAOUITE', 'MASSROUF', 'RENDEZ_VOUS');

-- CreateEnum
CREATE TYPE "AppointmentType" AS ENUM ('ACHAT', 'VENTE');

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT,
    "link" TEXT,
    "targetUserId" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "appointments" (
    "id" TEXT NOT NULL,
    "articleName" TEXT NOT NULL,
    "specs" TEXT,
    "type" "AppointmentType" NOT NULL DEFAULT 'ACHAT',
    "reminderAt" TIMESTAMP(3),
    "notified" BOOLEAN NOT NULL DEFAULT false,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "appointments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "notifications_targetUserId_idx" ON "notifications"("targetUserId");

-- CreateIndex
CREATE INDEX "notifications_createdAt_idx" ON "notifications"("createdAt");

-- CreateIndex
CREATE INDEX "appointments_createdById_idx" ON "appointments"("createdById");

-- CreateIndex
CREATE INDEX "appointments_reminderAt_idx" ON "appointments"("reminderAt");

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_targetUserId_fkey" FOREIGN KEY ("targetUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
