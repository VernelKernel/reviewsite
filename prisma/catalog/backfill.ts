import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../src/generated/prisma/client";
import {
  BACKFILL_MIN_REVIEW_CHARS,
  BACKFILL_PAGE_SIZE,
  BACKFILL_PAGES,
  REVIEWS_PER_GAME,
  THIN_EVALUATION_LIMIT,
} from "../../src/lib/catalog/config";
import { catalogIsDryRun } from "../../src/lib/catalog/run-mode";
import { reviewsStillNeeded } from "../../src/lib/catalog/reviews";
import { assertGeminiReady } from "./gemini";
import { ensureEvaluationTaxonomy, importSteamEvaluations, loadSteamReviews } from "./import-reviews";

const dryRun = catalogIsDryRun(process.argv, process.env);
const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

async function main() {
  if (!dryRun) {
    if (!process.env.GEMINI_API_KEY?.trim()) throw new Error("GEMINI_API_KEY is missing. Refusing to backfill evaluations.");
    await assertGeminiReady();
    await ensureEvaluationTaxonomy(prisma);
  }

  const pc = await prisma.platform.findUnique({ where: { slug: "pc" } });
  const works = await prisma.work.findMany({
    where: { steamAppId: { not: null }, workType: "GAME" },
    include: { _count: { select: { evaluations: true } } },
  });
  const thin = works
    .filter((work) => work.steamAppId !== null && work._count.evaluations < THIN_EVALUATION_LIMIT)
    .sort((left, right) => left._count.evaluations - right._count.evaluations || left.title.localeCompare(right.title));

  console.log(
    dryRun
      ? "Dry run. The database will not be changed."
      : `Backfill will read further through Steam for games under ${THIN_EVALUATION_LIMIT} evaluations.`,
  );
  console.log(`${thin.length} games have fewer than ${THIN_EVALUATION_LIMIT} evaluations.`);

  let imported = 0;
  for (const work of thin) {
    const steamAppId = work.steamAppId;
    if (steamAppId === null) continue;
    const options = {
      pages: BACKFILL_PAGES,
      pageSize: BACKFILL_PAGE_SIZE,
      minChars: BACKFILL_MIN_REVIEW_CHARS,
      limit: reviewsStillNeeded(work._count.evaluations, REVIEWS_PER_GAME),
    };
    if (dryRun) {
      try {
        const loaded = await loadSteamReviews(steamAppId, options);
        const total = loaded.total === null ? "an unknown number of" : String(loaded.total);
        console.log(`${work.title}: ${work._count.evaluations} evaluations, ${loaded.reviews.length} readable reviews out of ${total} on Steam.`);
      } catch (error) {
        console.error(`Could not read reviews for ${work.title}: ${error instanceof Error ? error.message : "request failed"}`);
      }
      continue;
    }
    const added = await importSteamEvaluations(
      prisma,
      { workId: work.id, steamAppId, title: work.title, platformId: pc?.id ?? null },
      options,
    );
    imported += added;
    console.log(`${work.title}: ${work._count.evaluations} before, ${added} imported.`);
  }
  if (!dryRun) console.log(`Imported ${imported} evaluations across ${thin.length} thin games.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
