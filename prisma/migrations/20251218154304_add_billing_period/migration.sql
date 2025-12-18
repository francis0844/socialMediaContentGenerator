-- AlterTable
ALTER TABLE "Account" ADD COLUMN     "billingPeriodEnd" TIMESTAMP(3),
ADD COLUMN     "billingPeriodStart" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "Account_billingPeriodStart_idx" ON "Account"("billingPeriodStart");

-- CreateIndex
CREATE INDEX "Account_billingPeriodEnd_idx" ON "Account"("billingPeriodEnd");
