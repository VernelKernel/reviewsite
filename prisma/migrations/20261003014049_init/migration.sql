-- CreateEnum
CREATE TYPE "WorkType" AS ENUM ('GAME', 'MOVIE', 'TV_SERIES', 'BOOK', 'ALBUM', 'OTHER');

-- CreateEnum
CREATE TYPE "WorkStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'UNLISTED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "CreatorRole" AS ENUM ('DEVELOPER', 'PUBLISHER', 'STUDIO', 'DIRECTOR', 'WRITER', 'COMPOSER', 'ARTIST', 'ACTOR', 'PRODUCER', 'OTHER');

-- CreateEnum
CREATE TYPE "ReleaseStatus" AS ENUM ('ANNOUNCED', 'EARLY_ACCESS', 'RELEASED', 'DELISTED');

-- CreateEnum
CREATE TYPE "MediaKind" AS ENUM ('KEY_ART', 'POSTER', 'SCREENSHOT', 'TRAILER', 'COVER', 'LOGO', 'OTHER');

-- CreateEnum
CREATE TYPE "MediaVisibility" AS ENUM ('PUBLIC', 'PRIVATE');

-- CreateEnum
CREATE TYPE "EvaluationLens" AS ENUM ('EXPERIENCE', 'EXECUTION', 'MIXED');

-- CreateEnum
CREATE TYPE "EvaluationStandard" AS ENUM ('ABSOLUTE', 'CONTEXTUAL', 'MIXED');

-- CreateEnum
CREATE TYPE "Stance" AS ENUM ('POSITIVE', 'MIXED', 'NEGATIVE');

-- CreateEnum
CREATE TYPE "CompletionStatus" AS ENUM ('JUST_STARTED', 'EARLY', 'SUBSTANTIAL', 'COMPLETED', 'ENDGAME', 'POST_GAME', 'ABANDONED', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "PlaytimeBucket" AS ENUM ('LESS_THAN_ONE_HOUR', 'ONE_TO_FIVE_HOURS', 'FIVE_TO_TEN_HOURS', 'TEN_TO_TWENTY_HOURS', 'TWENTY_TO_FIFTY_HOURS', 'FIFTY_PLUS_HOURS', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "OwnershipContext" AS ENUM ('OWNED', 'GIFTED', 'SUBSCRIPTION', 'BORROWED', 'REVIEW_COPY', 'FREE', 'OTHER');

-- CreateEnum
CREATE TYPE "EvaluationStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'UNLISTED', 'HIDDEN', 'REMOVED');

-- CreateEnum
CREATE TYPE "ReviewSource" AS ENUM ('INTERNAL', 'IMPORTED', 'MIGRATED');

-- CreateEnum
CREATE TYPE "ObservationPolarity" AS ENUM ('PRAISE', 'CRITICISM');

-- CreateEnum
CREATE TYPE "RelationKind" AS ENUM ('SAME_SERIES', 'SEQUEL', 'PREQUEL', 'SPIRITUAL_SUCCESSOR', 'ADAPTATION', 'REMAKE', 'REMASTER', 'RELATED');

-- CreateEnum
CREATE TYPE "AccountRole" AS ENUM ('USER', 'MODERATOR', 'EDITOR', 'ADMIN');

-- CreateEnum
CREATE TYPE "AuthProvider" AS ENUM ('EMAIL', 'GOOGLE', 'APPLE', 'DISCORD', 'STEAM');

-- CreateEnum
CREATE TYPE "ReportStatus" AS ENUM ('OPEN', 'REVIEWING', 'RESOLVED', 'DISMISSED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailVerified" TIMESTAMP(3),
    "role" "AccountRole" NOT NULL DEFAULT 'USER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuthenticationIdentity" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "provider" "AuthProvider" NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuthenticationIdentity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserPreference" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "theme" TEXT,
    "colorMode" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserPreference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReviewerProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "bio" TEXT,
    "avatarUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReviewerProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Work" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "workType" "WorkType" NOT NULL,
    "status" "WorkStatus" NOT NULL DEFAULT 'PUBLISHED',
    "synopsis" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Work_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkTitle" (
    "id" TEXT NOT NULL,
    "workId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "locale" TEXT,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "WorkTitle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Creator" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Creator_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkCreator" (
    "workId" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL,
    "role" "CreatorRole" NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "WorkCreator_pkey" PRIMARY KEY ("workId","creatorId","role")
);

-- CreateTable
CREATE TABLE "Genre" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Genre_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkGenre" (
    "workId" TEXT NOT NULL,
    "genreId" TEXT NOT NULL,

    CONSTRAINT "WorkGenre_pkey" PRIMARY KEY ("workId","genreId")
);

-- CreateTable
CREATE TABLE "Platform" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Platform_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkPlatform" (
    "workId" TEXT NOT NULL,
    "platformId" TEXT NOT NULL,

    CONSTRAINT "WorkPlatform_pkey" PRIMARY KEY ("workId","platformId")
);

-- CreateTable
CREATE TABLE "Region" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Region_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Release" (
    "id" TEXT NOT NULL,
    "workId" TEXT NOT NULL,
    "platformId" TEXT,
    "regionId" TEXT,
    "releasedOn" TIMESTAMP(3),
    "label" TEXT,
    "status" "ReleaseStatus" NOT NULL DEFAULT 'RELEASED',

    CONSTRAINT "Release_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MediaAsset" (
    "id" TEXT NOT NULL,
    "workId" TEXT NOT NULL,
    "kind" "MediaKind" NOT NULL,
    "src" TEXT NOT NULL,
    "alt" TEXT NOT NULL,
    "visibility" "MediaVisibility" NOT NULL DEFAULT 'PUBLIC',
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "MediaAsset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Evaluation" (
    "id" TEXT NOT NULL,
    "workId" TEXT NOT NULL,
    "reviewerId" TEXT NOT NULL,
    "status" "EvaluationStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "reviewedOn" TIMESTAMP(3),
    "lens" "EvaluationLens" NOT NULL,
    "standard" "EvaluationStandard" NOT NULL,
    "standardNote" TEXT,
    "enjoyment" "Stance" NOT NULL,
    "execution" "Stance" NOT NULL,
    "completion" "CompletionStatus" NOT NULL,
    "playtime" "PlaytimeBucket" NOT NULL DEFAULT 'UNKNOWN',
    "platformId" TEXT,
    "ownership" "OwnershipContext",

    CONSTRAINT "Evaluation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Review" (
    "id" TEXT NOT NULL,
    "evaluationId" TEXT NOT NULL,
    "title" TEXT,
    "body" TEXT NOT NULL,
    "source" "ReviewSource" NOT NULL DEFAULT 'INTERNAL',
    "importSourceName" TEXT,
    "importSourceUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Dimension" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "appliesTo" "WorkType"[],

    CONSTRAINT "Dimension_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EvaluationJudgment" (
    "id" TEXT NOT NULL,
    "evaluationId" TEXT NOT NULL,
    "dimensionId" TEXT NOT NULL,
    "stance" "Stance" NOT NULL,

    CONSTRAINT "EvaluationJudgment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Topic" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Topic_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Observation" (
    "id" TEXT NOT NULL,
    "evaluationId" TEXT NOT NULL,
    "topicId" TEXT NOT NULL,
    "polarity" "ObservationPolarity" NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Observation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkRelation" (
    "id" TEXT NOT NULL,
    "fromWorkId" TEXT NOT NULL,
    "toWorkId" TEXT NOT NULL,
    "kind" "RelationKind" NOT NULL,

    CONSTRAINT "WorkRelation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SavedWork" (
    "userId" TEXT NOT NULL,
    "workId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SavedWork_pkey" PRIMARY KEY ("userId","workId")
);

-- CreateTable
CREATE TABLE "FollowedWork" (
    "userId" TEXT NOT NULL,
    "workId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FollowedWork_pkey" PRIMARY KEY ("userId","workId")
);

-- CreateTable
CREATE TABLE "Report" (
    "id" TEXT NOT NULL,
    "reporterId" TEXT NOT NULL,
    "evaluationId" TEXT,
    "workId" TEXT,
    "reason" TEXT NOT NULL,
    "details" TEXT,
    "status" "ReportStatus" NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Report_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "AuthenticationIdentity_userId_idx" ON "AuthenticationIdentity"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "AuthenticationIdentity_provider_providerAccountId_key" ON "AuthenticationIdentity"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_tokenHash_key" ON "Session"("tokenHash");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- CreateIndex
CREATE INDEX "Session_expiresAt_idx" ON "Session"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "UserPreference_userId_key" ON "UserPreference"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ReviewerProfile_userId_key" ON "ReviewerProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ReviewerProfile_slug_key" ON "ReviewerProfile"("slug");

-- CreateIndex
CREATE INDEX "Work_workType_idx" ON "Work"("workType");

-- CreateIndex
CREATE INDEX "Work_status_idx" ON "Work"("status");

-- CreateIndex
CREATE INDEX "Work_title_idx" ON "Work"("title");

-- CreateIndex
CREATE UNIQUE INDEX "Work_workType_slug_key" ON "Work"("workType", "slug");

-- CreateIndex
CREATE INDEX "WorkTitle_workId_idx" ON "WorkTitle"("workId");

-- CreateIndex
CREATE INDEX "WorkTitle_title_idx" ON "WorkTitle"("title");

-- CreateIndex
CREATE UNIQUE INDEX "Creator_slug_key" ON "Creator"("slug");

-- CreateIndex
CREATE INDEX "Creator_name_idx" ON "Creator"("name");

-- CreateIndex
CREATE INDEX "WorkCreator_creatorId_idx" ON "WorkCreator"("creatorId");

-- CreateIndex
CREATE UNIQUE INDEX "Genre_slug_key" ON "Genre"("slug");

-- CreateIndex
CREATE INDEX "Genre_name_idx" ON "Genre"("name");

-- CreateIndex
CREATE INDEX "WorkGenre_genreId_idx" ON "WorkGenre"("genreId");

-- CreateIndex
CREATE UNIQUE INDEX "Platform_slug_key" ON "Platform"("slug");

-- CreateIndex
CREATE INDEX "WorkPlatform_platformId_idx" ON "WorkPlatform"("platformId");

-- CreateIndex
CREATE UNIQUE INDEX "Region_code_key" ON "Region"("code");

-- CreateIndex
CREATE INDEX "Release_workId_idx" ON "Release"("workId");

-- CreateIndex
CREATE INDEX "Release_platformId_idx" ON "Release"("platformId");

-- CreateIndex
CREATE INDEX "Release_regionId_idx" ON "Release"("regionId");

-- CreateIndex
CREATE INDEX "Release_releasedOn_idx" ON "Release"("releasedOn");

-- CreateIndex
CREATE INDEX "MediaAsset_workId_kind_idx" ON "MediaAsset"("workId", "kind");

-- CreateIndex
CREATE INDEX "Evaluation_workId_status_idx" ON "Evaluation"("workId", "status");

-- CreateIndex
CREATE INDEX "Evaluation_workId_reviewedOn_idx" ON "Evaluation"("workId", "reviewedOn");

-- CreateIndex
CREATE INDEX "Evaluation_reviewerId_idx" ON "Evaluation"("reviewerId");

-- CreateIndex
CREATE INDEX "Evaluation_lens_idx" ON "Evaluation"("lens");

-- CreateIndex
CREATE INDEX "Evaluation_standard_idx" ON "Evaluation"("standard");

-- CreateIndex
CREATE UNIQUE INDEX "Evaluation_reviewerId_workId_key" ON "Evaluation"("reviewerId", "workId");

-- CreateIndex
CREATE UNIQUE INDEX "Review_evaluationId_key" ON "Review"("evaluationId");

-- CreateIndex
CREATE UNIQUE INDEX "Dimension_slug_key" ON "Dimension"("slug");

-- CreateIndex
CREATE INDEX "EvaluationJudgment_dimensionId_stance_idx" ON "EvaluationJudgment"("dimensionId", "stance");

-- CreateIndex
CREATE UNIQUE INDEX "EvaluationJudgment_evaluationId_dimensionId_key" ON "EvaluationJudgment"("evaluationId", "dimensionId");

-- CreateIndex
CREATE UNIQUE INDEX "Topic_slug_key" ON "Topic"("slug");

-- CreateIndex
CREATE INDEX "Observation_evaluationId_idx" ON "Observation"("evaluationId");

-- CreateIndex
CREATE INDEX "Observation_topicId_polarity_idx" ON "Observation"("topicId", "polarity");

-- CreateIndex
CREATE INDEX "WorkRelation_toWorkId_idx" ON "WorkRelation"("toWorkId");

-- CreateIndex
CREATE UNIQUE INDEX "WorkRelation_fromWorkId_toWorkId_kind_key" ON "WorkRelation"("fromWorkId", "toWorkId", "kind");

-- CreateIndex
CREATE INDEX "SavedWork_workId_idx" ON "SavedWork"("workId");

-- CreateIndex
CREATE INDEX "FollowedWork_workId_idx" ON "FollowedWork"("workId");

-- CreateIndex
CREATE INDEX "Report_reporterId_idx" ON "Report"("reporterId");

-- CreateIndex
CREATE INDEX "Report_evaluationId_idx" ON "Report"("evaluationId");

-- CreateIndex
CREATE INDEX "Report_workId_idx" ON "Report"("workId");

-- CreateIndex
CREATE INDEX "Report_status_idx" ON "Report"("status");

-- AddForeignKey
ALTER TABLE "AuthenticationIdentity" ADD CONSTRAINT "AuthenticationIdentity_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserPreference" ADD CONSTRAINT "UserPreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewerProfile" ADD CONSTRAINT "ReviewerProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkTitle" ADD CONSTRAINT "WorkTitle_workId_fkey" FOREIGN KEY ("workId") REFERENCES "Work"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkCreator" ADD CONSTRAINT "WorkCreator_workId_fkey" FOREIGN KEY ("workId") REFERENCES "Work"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkCreator" ADD CONSTRAINT "WorkCreator_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "Creator"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkGenre" ADD CONSTRAINT "WorkGenre_workId_fkey" FOREIGN KEY ("workId") REFERENCES "Work"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkGenre" ADD CONSTRAINT "WorkGenre_genreId_fkey" FOREIGN KEY ("genreId") REFERENCES "Genre"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkPlatform" ADD CONSTRAINT "WorkPlatform_workId_fkey" FOREIGN KEY ("workId") REFERENCES "Work"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkPlatform" ADD CONSTRAINT "WorkPlatform_platformId_fkey" FOREIGN KEY ("platformId") REFERENCES "Platform"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Release" ADD CONSTRAINT "Release_workId_fkey" FOREIGN KEY ("workId") REFERENCES "Work"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Release" ADD CONSTRAINT "Release_platformId_fkey" FOREIGN KEY ("platformId") REFERENCES "Platform"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Release" ADD CONSTRAINT "Release_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "Region"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MediaAsset" ADD CONSTRAINT "MediaAsset_workId_fkey" FOREIGN KEY ("workId") REFERENCES "Work"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Evaluation" ADD CONSTRAINT "Evaluation_workId_fkey" FOREIGN KEY ("workId") REFERENCES "Work"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Evaluation" ADD CONSTRAINT "Evaluation_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "ReviewerProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Evaluation" ADD CONSTRAINT "Evaluation_platformId_fkey" FOREIGN KEY ("platformId") REFERENCES "Platform"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_evaluationId_fkey" FOREIGN KEY ("evaluationId") REFERENCES "Evaluation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EvaluationJudgment" ADD CONSTRAINT "EvaluationJudgment_evaluationId_fkey" FOREIGN KEY ("evaluationId") REFERENCES "Evaluation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EvaluationJudgment" ADD CONSTRAINT "EvaluationJudgment_dimensionId_fkey" FOREIGN KEY ("dimensionId") REFERENCES "Dimension"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Observation" ADD CONSTRAINT "Observation_evaluationId_fkey" FOREIGN KEY ("evaluationId") REFERENCES "Evaluation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Observation" ADD CONSTRAINT "Observation_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "Topic"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkRelation" ADD CONSTRAINT "WorkRelation_fromWorkId_fkey" FOREIGN KEY ("fromWorkId") REFERENCES "Work"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkRelation" ADD CONSTRAINT "WorkRelation_toWorkId_fkey" FOREIGN KEY ("toWorkId") REFERENCES "Work"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavedWork" ADD CONSTRAINT "SavedWork_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavedWork" ADD CONSTRAINT "SavedWork_workId_fkey" FOREIGN KEY ("workId") REFERENCES "Work"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FollowedWork" ADD CONSTRAINT "FollowedWork_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FollowedWork" ADD CONSTRAINT "FollowedWork_workId_fkey" FOREIGN KEY ("workId") REFERENCES "Work"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_evaluationId_fkey" FOREIGN KEY ("evaluationId") REFERENCES "Evaluation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_workId_fkey" FOREIGN KEY ("workId") REFERENCES "Work"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
