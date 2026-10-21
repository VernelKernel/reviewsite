-- CreateEnum
CREATE TYPE "Mattered" AS ENUM ('A_LITTLE', 'QUITE_A_BIT', 'MATTERS_A_LOT');

-- AlterTable
ALTER TABLE "EvaluationJudgment" ADD COLUMN "mattered" "Mattered";
