import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../src/generated/prisma/client";
import { AUDIENCE_SAMPLE_TARGET, BACKFILL_MAX_PAGES, BACKFILL_PAGE_SIZE, MIN_REVIEW_CHARS } from "../../src/lib/catalog/config";
import { catalogIsDryRun } from "../../src/lib/catalog/run-mode";
import { reviewsStillNeeded } from "../../src/lib/catalog/reviews";
import { assertGeminiReady } from "./gemini";
import { audienceSteamIds, ensureEvaluationTaxonomy, importSteamEvaluations, loadSteamReviews, type ReviewLoadOptions } from "./import-reviews";

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
    include: { _count: { select: { evaluations: { where: { population: "AUDIENCE" } } } } },
  });
  const pending = works
    .filter((work) => work.steamAppId !== null && work._count.evaluations < AUDIENCE_SAMPLE_TARGET)
    .sort((left, right) => left._count.evaluations - right._count.evaluations || left.title.localeCompare(right.title));

  console.log(
    dryRun
      ? "Dry run. The database will not be changed."
      : `Backfill will sample Steam reviews until each game has ${AUDIENCE_SAMPLE_TARGET} audience evaluations.`,
  );
  console.log(`${pending.length} games are under ${AUDIENCE_SAMPLE_TARGET} audience evaluations.`);

  let imported = 0;
  for (const work of pending) {
    const steamAppId = work.steamAppId;
    if (steamAppId === null) continue;
    const limit = reviewsStillNeeded(work._count.evaluations, AUDIENCE_SAMPLE_TARGET);
    if (limit === 0) continue;
    const excludeSteamIds = await audienceSteamIds(prisma, work.id);
    const options: ReviewLoadOptions = {
      pages: BACKFILL_MAX_PAGES,
      pageSize: BACKFILL_PAGE_SIZE,
      minChars: MIN_REVIEW_CHARS,
      limit,
      excludeSteamIds,
      spread: true,
    };
    if (dryRun) {
      try {
        const loaded = await loadSteamReviews(steamAppId, options);
        const total = loaded.total === null ? "an unknown number of" : String(loaded.total);
        const cap = loaded.capped ? " Scan stopped at the page cap, so this sample is the newest portion of the feed." : "";
        console.log(
          `${work.title}: ${work._count.evaluations} audience evaluations, ${loaded.reviews.length} reviews sampled out of ${total} on Steam.${cap}`,
        );
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
    console.log(`${work.title}: ${work._count.evaluations} audience evaluations before, ${added} imported.`);
  }
  if (!dryRun) console.log(`Imported ${imported} evaluations across ${pending.length} games.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
