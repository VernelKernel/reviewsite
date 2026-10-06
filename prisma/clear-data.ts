import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

export async function clearDatabase(prisma: PrismaClient) {
  await prisma.catalogPlacement.deleteMany();
  await prisma.catalogBatch.deleteMany();
  await prisma.steamReception.deleteMany();
  await prisma.workTag.deleteMany();
  await prisma.report.deleteMany();
  await prisma.observation.deleteMany();
  await prisma.evaluationJudgment.deleteMany();
  await prisma.review.deleteMany();
  await prisma.evaluation.deleteMany();
  await prisma.savedWork.deleteMany();
  await prisma.followedWork.deleteMany();
  await prisma.session.deleteMany();
  await prisma.userPreference.deleteMany();
  await prisma.workRelation.deleteMany();
  await prisma.mediaAsset.deleteMany();
  await prisma.workPlatform.deleteMany();
  await prisma.release.deleteMany();
  await prisma.workGenre.deleteMany();
  await prisma.workCreator.deleteMany();
  await prisma.workTitle.deleteMany();
  await prisma.work.deleteMany();
  await prisma.reviewerProfile.deleteMany();
  await prisma.authenticationIdentity.deleteMany();
  await prisma.user.deleteMany();
  await prisma.dimension.deleteMany();
  await prisma.topic.deleteMany();
  await prisma.tag.deleteMany();
  await prisma.genre.deleteMany();
  await prisma.platform.deleteMany();
  await prisma.region.deleteMany();
  await prisma.creator.deleteMany();
}

function isDirectRun(): boolean {
  const entry = process.argv[1]?.replaceAll("\\", "/") ?? "";
  return entry.endsWith("prisma/clear-data.ts");
}

async function main() {
  if (!process.argv.includes("--yes")) {
    console.error("This deletes every work, evaluation, reviewer, and catalog batch. Re-run with --yes.");
    process.exitCode = 1;
    return;
  }
  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
  });
  try {
    const before = await prisma.work.count();
    await clearDatabase(prisma);
    const after = await prisma.work.count();
    console.log(`Removed catalog data. Works before: ${before}. Works after: ${after}.`);
  } finally {
    await prisma.$disconnect();
  }
}

if (isDirectRun()) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
