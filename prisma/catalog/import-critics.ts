import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../src/generated/prisma/client";
import { articleText } from "../../src/lib/catalog/article-text";
import { attachReviewedPlatform } from "./attach-platform";
import { catalogIsDryRun } from "../../src/lib/catalog/run-mode";
import { expandOutlets } from "../../src/lib/catalog/expand-outlets";
import { archiveOutlet, articleLocations, mergeOutlets, outletsForGame, pickReviewLink, postSitemapUrls, type Outlet } from "../../src/lib/catalog/outlets";
import { GeminiError, assertGeminiReady, interpretCriticReview } from "./gemini";
import { ensureEvaluationTaxonomy } from "./import-reviews";

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

const sitemapPages = new Map<string, string>();

async function reviewUrlFor(outlet: Outlet, title: string): Promise<string | null> {
  if (outlet.lookup === "sitemap") {
    return pickReviewLink(await sitemapPage(outlet), outlet, title);
  }
  return pickReviewLink(await fetchHtml(outlet.searchUrl(title)), outlet, title);
}

async function sitemapPage(outlet: Outlet): Promise<string> {
  const cached = sitemapPages.get(outlet.slug);
  if (cached) return cached;
  const index = await fetchHtml(outlet.searchUrl(""));
  const parts = postSitemapUrls(index);
  const links: string[] = [];
  if (parts.length === 0) {
    links.push(...articleLocations(index));
  } else {
    for (const part of parts) {
      links.push(...articleLocations(await fetchHtml(part)));
    }
  }
  const page = links.map((link) => `<a href="${link}">`).join("\n");
  sitemapPages.set(outlet.slug, page);
  console.log(`${outlet.name} · ${links.length} archive links`);
  return page;
}

async function outletReviewer(outlet: Outlet) {
  const existing = await prisma.reviewerProfile.findUnique({ where: { slug: outlet.slug } });
  if (existing) return existing;
  const user = await prisma.user.create({ data: { email: `${outlet.slug}@outlets.invalid` } });
  return prisma.reviewerProfile.create({
    data: {
      userId: user.id,
      slug: outlet.slug,
      displayName: outlet.name,
      bio: `Critic readings translated from ${outlet.name}. The article stays on their site.`,
    },
  });
}

async function main() {
  if (!dryRun) {
    await assertGeminiReady();
    await ensureEvaluationTaxonomy(prisma);
    const enabled = await prisma.outletExpansion.findMany({ where: { enabled: true }, select: { workId: true } });
    if (enabled.length > 0) {
      const expansion = await expandOutlets(prisma, enabled.map((item) => item.workId));
      if (expansion.error) console.error(expansion.error);
      else console.log(`Outlet pass · ${expansion.added.length} publications added across ${expansion.checkedGames} games.`);
    }
  }
  const tracked = await prisma.trackedOutlet.findMany({ where: { lookup: "sitemap", archiveUrl: { not: null } } });
  const extraOutlets: Outlet[] = tracked.flatMap((row) => (row.archiveUrl ? [archiveOutlet(row.slug, row.name, row.host, row.archiveUrl)] : []));

  const games = await prisma.work.findMany({
    where: { status: "PUBLISHED", workType: "GAME" },
    orderBy: { title: "asc" },
    select: {
      id: true,
      title: true,
      platforms: { select: { platform: { select: { slug: true } } } },
      creators: { where: { role: "PUBLISHER" }, select: { creator: { select: { name: true } } } },
      catalogPlacements: { select: { slot: true } },
      evaluations: {
        where: { population: "CRITIC" },
        select: { reviewer: { select: { slug: true } } },
      },
    },
  });

  const [dimensionIds, topicIds] = dryRun
    ? [[], []]
    : await Promise.all([
        prisma.dimension.findMany({ select: { id: true, slug: true } }),
        prisma.topic.findMany({ select: { id: true, slug: true } }),
      ]);
  const dimensionId = new Map(dimensionIds.map((dimension) => [dimension.slug, dimension.id]));
  const topicId = new Map(topicIds.map((topic) => [topic.slug, topic.id]));

  let found = 0;
  let written = 0;
  let missed = 0;

  for (const game of games) {
    const outlets = mergeOutlets(
      outletsForGame({
        platforms: game.platforms.map((item) => item.platform.slug),
        slots: game.catalogPlacements.map((item) => item.slot),
        publishers: game.creators.map((item) => item.creator.name),
      }),
      extraOutlets,
    );
    const have = new Set(game.evaluations.map((item) => item.reviewer.slug));

    for (const outlet of outlets) {
      if (have.has(outlet.slug)) continue;
      let reviewUrl: string | null = null;
      try {
        reviewUrl = await reviewUrlFor(outlet, game.title);
      } catch (error) {
        missed += 1;
        console.error(`${game.title} · ${outlet.name} · search failed: ${error instanceof Error ? error.message : "request failed"}`);
        continue;
      }
      if (!reviewUrl) {
        missed += 1;
        console.log(`${game.title} · ${outlet.name} · no review`);
        continue;
      }
      found += 1;
      if (dryRun) {
        console.log(`${game.title} · ${outlet.name} · ${reviewUrl}`);
        continue;
      }

      try {
        const page = await fetchHtml(reviewUrl);
        const body = articleText(page).slice(0, 8000);
        if (body.length < MIN_ARTICLE_CHARS) {
          console.error(`${game.title} · ${outlet.name} · unreadable page`);
          continue;
        }
        const reading = await interpretCriticReview({ title: game.title, outlet: outlet.name, body });
        if (!reading) {
          console.error(`${game.title} · ${outlet.name} · the reading did not match an evaluation`);
          continue;
        }
        const profile = await outletReviewer(outlet);
        const platformId = await attachReviewedPlatform(prisma, game.id, game.title, reading.platform);
        const already = await prisma.evaluation.findUnique({
          where: { reviewerId_workId: { reviewerId: profile.id, workId: game.id } },
        });
        if (already) continue;
        await prisma.evaluation.create({
          data: {
            workId: game.id,
            reviewerId: profile.id,
            status: "PUBLISHED",
            lens: reading.lens,
            standard: reading.standard,
            standardNote: reading.standardNote,
            enjoyment: reading.enjoyment,
            execution: reading.execution,
            completion: reading.completion,
            playtime: "UNKNOWN",
            platformId,
            population: "CRITIC",
            review: {
              create: {
                body: "",
                source: "IMPORTED",
                importSourceName: outlet.name,
                importSourceUrl: reviewUrl,
              },
            },
            judgments: {
              create: reading.judgments
                .filter((judgment) => dimensionId.has(judgment.dimension))
                .map((judgment) => ({ dimensionId: dimensionId.get(judgment.dimension)!, stance: judgment.stance })),
            },
            observations: {
              create: reading.observations
                .filter((observation) => topicId.has(observation.topic))
                .map((observation) => ({
                  topicId: topicId.get(observation.topic)!,
                  polarity: observation.polarity,
                  content: observation.content,
                })),
            },
          },
        });
        written += 1;
        have.add(outlet.slug);
        console.log(`${game.title} · ${outlet.name} · ${reading.enjoyment.toLowerCase()} enjoyment, ${reading.execution.toLowerCase()} execution`);
      } catch (error) {
        if (error instanceof GeminiError && (error.status === 401 || error.status === 403 || error.status === 0)) throw error;
        console.error(`${game.title} · ${outlet.name} · ${error instanceof Error ? error.message : "import failed"}`);
      }
    }
  }

  console.log(dryRun ? `Dry run. ${found} review links, ${missed} misses. Nothing was written.` : `Wrote ${written} critic readings from ${found} links. ${missed} misses.`);
  await prisma.$disconnect();
}

main().catch(async (error) => {
  console.error(error instanceof Error ? error.message : error);
  await prisma.$disconnect();
  process.exit(1);
});
