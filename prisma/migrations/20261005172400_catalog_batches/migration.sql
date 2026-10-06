-- AlterTable
ALTER TABLE "Work" ADD COLUMN "steamAppId" INTEGER;

-- AlterTable
ALTER TABLE "WorkGenre" ADD COLUMN "isPrimary" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE UNIQUE INDEX "Work_steamAppId_key" ON "Work"("steamAppId");

-- CreateEnum
CREATE TYPE "CatalogSlot" AS ENUM ('NEW_AAA', 'NEW_INDIE', 'RECENT_AAA', 'RECENT_AA', 'RECENT_INDIE', 'SETTLED_AAA', 'SETTLED_AA', 'SETTLED_INDIE', 'MULTIPLATFORM', 'GENRE_DEBT');

-- CreateTable
CREATE TABLE "Tag" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Tag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkTag" (
    "workId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,

    CONSTRAINT "WorkTag_pkey" PRIMARY KEY ("workId","tagId")
);

-- CreateTable
CREATE TABLE "SteamReception" (
    "id" TEXT NOT NULL,
    "workId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "positiveCount" INTEGER NOT NULL,
    "negativeCount" INTEGER NOT NULL,
    "totalCount" INTEGER NOT NULL,
    "fetchedAt" TIMESTAMP(3) NOT NULL,
    "storeUrl" TEXT NOT NULL,
    "reviewsUrl" TEXT NOT NULL,

    CONSTRAINT "SteamReception_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CatalogBatch" (
    "id" TEXT NOT NULL,
    "anchor" TIMESTAMP(3) NOT NULL,
    "nextAnchor" TIMESTAMP(3) NOT NULL,
    "campaignComplete" BOOLEAN NOT NULL DEFAULT false,
    "shortfalls" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CatalogBatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CatalogPlacement" (
    "id" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "workId" TEXT NOT NULL,
    "slot" "CatalogSlot" NOT NULL,
    "primaryGenreSlug" TEXT NOT NULL,
    "windowWidened" BOOLEAN NOT NULL DEFAULT false,
    "buzzMet" BOOLEAN,
    "releasedOn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CatalogPlacement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Tag_slug_key" ON "Tag"("slug");

-- CreateIndex
CREATE INDEX "Tag_name_idx" ON "Tag"("name");

-- CreateIndex
CREATE INDEX "WorkTag_tagId_idx" ON "WorkTag"("tagId");

-- CreateIndex
CREATE UNIQUE INDEX "SteamReception_workId_key" ON "SteamReception"("workId");

-- CreateIndex
CREATE INDEX "CatalogBatch_createdAt_idx" ON "CatalogBatch"("createdAt");

-- CreateIndex
CREATE INDEX "CatalogPlacement_workId_idx" ON "CatalogPlacement"("workId");

-- CreateIndex
CREATE UNIQUE INDEX "CatalogPlacement_batchId_workId_key" ON "CatalogPlacement"("batchId", "workId");

-- AddForeignKey
ALTER TABLE "WorkTag" ADD CONSTRAINT "WorkTag_workId_fkey" FOREIGN KEY ("workId") REFERENCES "Work"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkTag" ADD CONSTRAINT "WorkTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SteamReception" ADD CONSTRAINT "SteamReception_workId_fkey" FOREIGN KEY ("workId") REFERENCES "Work"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CatalogPlacement" ADD CONSTRAINT "CatalogPlacement_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "CatalogBatch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CatalogPlacement" ADD CONSTRAINT "CatalogPlacement_workId_fkey" FOREIGN KEY ("workId") REFERENCES "Work"("id") ON DELETE CASCADE ON UPDATE CASCADE;
