-- CreateTable
CREATE TABLE "OutletExpansion" (
    "workId" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OutletExpansion_pkey" PRIMARY KEY ("workId")
);

-- CreateTable
CREATE TABLE "TrackedOutlet" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "host" TEXT NOT NULL,
    "lookup" TEXT NOT NULL DEFAULT 'unresolved',
    "archiveUrl" TEXT,
    "archiveChecked" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TrackedOutlet_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TrackedOutlet_slug_key" ON "TrackedOutlet"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "TrackedOutlet_host_key" ON "TrackedOutlet"("host");

-- AddForeignKey
ALTER TABLE "OutletExpansion" ADD CONSTRAINT "OutletExpansion_workId_fkey" FOREIGN KEY ("workId") REFERENCES "Work"("id") ON DELETE CASCADE ON UPDATE CASCADE;
