-- Critic readings leave lens and standard unset when the review does not state them.
ALTER TABLE "Evaluation" ALTER COLUMN "lens" DROP NOT NULL;
ALTER TABLE "Evaluation" ALTER COLUMN "standard" DROP NOT NULL;
