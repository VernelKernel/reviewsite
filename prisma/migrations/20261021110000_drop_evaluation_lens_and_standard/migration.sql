DROP INDEX "Evaluation_lens_idx";
DROP INDEX "Evaluation_standard_idx";

ALTER TABLE "Evaluation" DROP COLUMN "lens";
ALTER TABLE "Evaluation" DROP COLUMN "standard";
ALTER TABLE "Evaluation" DROP COLUMN "standardNote";

DROP TYPE "EvaluationLens";
DROP TYPE "EvaluationStandard";
