-- CreateTable
CREATE TABLE "FollowedReviewer" (
    "userId" TEXT NOT NULL,
    "reviewerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FollowedReviewer_pkey" PRIMARY KEY ("userId","reviewerId")
);

-- CreateIndex
CREATE INDEX "FollowedReviewer_reviewerId_idx" ON "FollowedReviewer"("reviewerId");

-- AddForeignKey
ALTER TABLE "FollowedReviewer" ADD CONSTRAINT "FollowedReviewer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FollowedReviewer" ADD CONSTRAINT "FollowedReviewer_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "ReviewerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
