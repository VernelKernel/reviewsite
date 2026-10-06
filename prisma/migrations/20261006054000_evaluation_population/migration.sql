-- CreateEnum
CREATE TYPE "EvaluationPopulation" AS ENUM ('CRITIC', 'AUDIENCE');

-- AlterTable
ALTER TABLE "Evaluation" ADD COLUMN "population" "EvaluationPopulation" NOT NULL DEFAULT 'AUDIENCE';

-- CreateIndex
CREATE INDEX "Evaluation_workId_population_idx" ON "Evaluation"("workId", "population");
