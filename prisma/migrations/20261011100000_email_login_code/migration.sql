-- CreateEnum
CREATE TYPE "AccountDeletionReason" AS ENUM ('NOT_USING', 'PRIVACY', 'HARD_TO_USE', 'NEW_ACCOUNT', 'OTHER');

-- CreateTable
CREATE TABLE "EmailLoginCode" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "codeHash" TEXT NOT NULL,
    "pendingDisplayName" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "attemptCount" INTEGER NOT NULL DEFAULT 0,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmailLoginCode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AccountDeletionFeedback" (
    "id" TEXT NOT NULL,
    "reason" "AccountDeletionReason" NOT NULL,
    "otherText" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AccountDeletionFeedback_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EmailLoginCode_userId_idx" ON "EmailLoginCode"("userId");

-- CreateIndex
CREATE INDEX "EmailLoginCode_expiresAt_idx" ON "EmailLoginCode"("expiresAt");

-- AddForeignKey
ALTER TABLE "EmailLoginCode" ADD CONSTRAINT "EmailLoginCode_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
