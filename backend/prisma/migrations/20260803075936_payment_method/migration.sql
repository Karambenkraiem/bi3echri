-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('CASH', 'VIREMENT', 'CHEQUE');

-- AlterTable
ALTER TABLE "cash_movements" ADD COLUMN     "paymentMethod" "PaymentMethod" NOT NULL DEFAULT 'CASH';

-- CreateIndex
CREATE INDEX "cash_movements_paymentMethod_idx" ON "cash_movements"("paymentMethod");
