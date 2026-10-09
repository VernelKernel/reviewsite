import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../src/generated/prisma/client";
import { articleText } from "../../src/lib/catalog/article-text";
import { reviewPlatformName } from "../../src/lib/catalog/interpret";
import { catalogIsDryRun } from "../../src/lib/catalog/run-mode";
import { attachReviewedPlatform } from "./attach-platform";
import { GeminiError, assertGeminiReady, interpretCriticPlatform } from "./gemini";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

const dryRun = catalogIsDryRun(process.argv, process.env);
const MIN_ARTICLE_CHARS = 400;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchHtml(url: string): Promise<string> {
  await sleep(400);
  const response = await fetch(url, {
    headers: {
      Accept: "text/html,application/xhtml+xml",
      "User-Agent": "FrameCatalog/0.1 (critic reading; +https://frame.local)",
    },
    redirect: "follow",
    signal: AbortSignal.timeout(20000),
  });
  if (!response.ok) throw new Error(`${response.status} for ${url}`);
  return response.text();
}

async function main() {
  if (!dryRun) await assertGeminiReady();

  const readings = await prisma.evaluation.findMany({
    where: {
      population: "CRITIC",
      platformId: null,
      review: { source: "IMPORTED", importSourceUrl: { not: null } },
    },
    orderBy: [{ work: { title: "asc" } }, { reviewer: { displayName: "asc" } }],
    select: {
      id: true,
      work: { select: { id: true, title: true } },
      reviewer: { select: { displayName: true } },
      review: { select: { importSourceName: true, importSourceUrl: true } },
    },
  });

  let aligned = 0;
  let unstated = 0;
  let unreadable = 0;
  let failed = 0;

  for (const reading of readings) {
    const title = reading.work.title;
    const outlet = reading.review?.importSourceName || reading.reviewer.displayName;
    const url = reading.review?.importSourceUrl;
    if (!url) continue;

    try {
      const page = await fetchHtml(url);
      const body = articleText(page).slice(0, 8000);
      if (body.length < MIN_ARTICLE_CHARS) {
        unreadable += 1;
        console.error(`${title} · ${outlet} · unreadable page`);
        continue;
      }
      const platform = await interpretCriticPlatform({ title, outlet, body });
      if (!platform) {
        unstated += 1;
        console.log(`${title} · ${outlet} · platform unstated`);
        continue;
      }
      const name = reviewPlatformName(platform);
      if (dryRun) {
        aligned += 1;
        console.log(`${title} · ${outlet} · ${name}`);
        continue;
      }
      const platformId = await attachReviewedPlatform(prisma, reading.work.id, title, platform);
      await prisma.evaluation.update({ where: { id: reading.id }, data: { platformId } });
      aligned += 1;
      console.log(`${title} · ${outlet} · ${name}`);
    } catch (error) {
      if (error instanceof GeminiError && (error.status === 401 || error.status === 403 || error.status === 0)) throw error;
      failed += 1;
      console.error(`${title} · ${outlet} · ${error instanceof Error ? error.message : "align failed"}`);
    }
  }

  console.log(
    dryRun
      ? `Dry run. ${aligned} platforms from ${readings.length} readings. ${unstated} unstated, ${unreadable} unreadable, ${failed} failed. Nothing was written.`
      : `Aligned ${aligned} of ${readings.length} critic readings. ${unstated} unstated, ${unreadable} unreadable, ${failed} failed.`,
  );
  await prisma.$disconnect();
}

main().catch(async (error) => {
  console.error(error instanceof Error ? error.message : error);
  await prisma.$disconnect();
  process.exit(1);
});
