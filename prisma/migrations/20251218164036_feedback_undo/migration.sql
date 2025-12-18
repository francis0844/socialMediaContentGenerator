-- AlterTable
ALTER TABLE "Feedback" ADD COLUMN     "previousMemorySnapshot" TEXT,
ADD COLUMN     "undoReason" TEXT,
ADD COLUMN     "undoneAt" TIMESTAMP(3);
