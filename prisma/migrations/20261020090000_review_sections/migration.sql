-- AlterTable
ALTER TABLE "Intake" ADD COLUMN "reviewSections" JSONB NOT NULL DEFAULT '[]';

-- CreateTable
CREATE TABLE "ReviewSection" (
    "id" TEXT NOT NULL,
    "reviewId" TEXT NOT NULL,
    "dimensionId" TEXT,
    "body" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ReviewSection_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ReviewSection_reviewId_sortOrder_idx" ON "ReviewSection"("reviewId", "sortOrder");

-- CreateIndex
CREATE INDEX "ReviewSection_dimensionId_idx" ON "ReviewSection"("dimensionId");

-- AddForeignKey
ALTER TABLE "ReviewSection" ADD CONSTRAINT "ReviewSection_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "Review"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewSection" ADD CONSTRAINT "ReviewSection_dimensionId_fkey" FOREIGN KEY ("dimensionId") REFERENCES "Dimension"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
