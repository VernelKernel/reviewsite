-- CreateExtension
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- CreateEnum
CREATE TYPE "IntakeMatchStatus" AS ENUM ('PENDING', 'MATCHED', 'UNMATCHED', 'AMBIGUOUS', 'FAILED');

-- CreateTable
CREATE TABLE "Intake" (
    "id" TEXT NOT NULL,
    "secretHash" TEXT NOT NULL,
    "workType" "WorkType" NOT NULL,
    "rawTitle" TEXT NOT NULL,
    "normalizedTitle" TEXT NOT NULL,
    "rawPlatform" TEXT,
    "rawGenre" TEXT,
    "enjoyment" "Stance" NOT NULL,
    "execution" "Stance" NOT NULL,
    "completion" "CompletionStatus" NOT NULL DEFAULT 'SUBSTANTIAL',
    "reviewBody" TEXT,
    "judgments" JSONB NOT NULL DEFAULT '[]',
    "matchStatus" "IntakeMatchStatus" NOT NULL DEFAULT 'PENDING',
    "matchNote" TEXT,
    "workId" TEXT,
    "userId" TEXT,
    "evaluationId" TEXT,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Intake_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "intakeId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VerificationToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SteamLookupCache" (
    "normalizedTitle" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "fetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SteamLookupCache_pkey" PRIMARY KEY ("normalizedTitle")
);

-- CreateIndex
CREATE UNIQUE INDEX "Intake_secretHash_key" ON "Intake"("secretHash");

-- CreateIndex
CREATE UNIQUE INDEX "Intake_evaluationId_key" ON "Intake"("evaluationId");

-- CreateIndex
CREATE INDEX "Intake_matchStatus_idx" ON "Intake"("matchStatus");

-- CreateIndex
CREATE INDEX "Intake_userId_idx" ON "Intake"("userId");

-- CreateIndex
CREATE INDEX "Intake_expiresAt_idx" ON "Intake"("expiresAt");

-- CreateIndex
CREATE INDEX "Intake_normalizedTitle_workType_idx" ON "Intake"("normalizedTitle", "workType");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_tokenHash_key" ON "VerificationToken"("tokenHash");

-- CreateIndex
CREATE INDEX "VerificationToken_userId_idx" ON "VerificationToken"("userId");

-- CreateIndex
CREATE INDEX "VerificationToken_intakeId_idx" ON "VerificationToken"("intakeId");

-- CreateIndex
CREATE INDEX "Work_title_trgm_idx" ON "Work" USING gin ("title" gin_trgm_ops);

-- CreateIndex
CREATE INDEX "WorkTitle_title_trgm_idx" ON "WorkTitle" USING gin ("title" gin_trgm_ops);

-- AddForeignKey
ALTER TABLE "Intake" ADD CONSTRAINT "Intake_workId_fkey" FOREIGN KEY ("workId") REFERENCES "Work"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Intake" ADD CONSTRAINT "Intake_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Intake" ADD CONSTRAINT "Intake_evaluationId_fkey" FOREIGN KEY ("evaluationId") REFERENCES "Evaluation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VerificationToken" ADD CONSTRAINT "VerificationToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VerificationToken" ADD CONSTRAINT "VerificationToken_intakeId_fkey" FOREIGN KEY ("intakeId") REFERENCES "Intake"("id") ON DELETE CASCADE ON UPDATE CASCADE;
