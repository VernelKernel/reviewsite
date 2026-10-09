import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, type CatalogSlot } from "../../src/generated/prisma/client";
import { CAMPAIGN_FLOOR, CAMPAIGN_SAMPLE, HYDRATION_PER_BAND, INITIAL_ANCHOR_LAG_DAYS, REVIEWS_PER_GAME } from "../../src/lib/catalog/config";
import { parseConsoleReleases } from "../../src/lib/catalog/consoles";
import { asUtcDate, initialAnchor, todayIso } from "../../src/lib/catalog/dates";
import { catalogIsDryRun } from "../../src/lib/catalog/run-mode";
import { CANONICAL_GENRES, mapSteamLabels } from "../../src/lib/catalog/genres";
import {
  parseAppDetails,
  parsePlayerCount,
  parsePopularTags,
  parseReviewSummary,
  parseSearchPage,
  slugify,
  type ReviewSummary,
} from "../../src/lib/catalog/parse";
import { publicCreditName, tierForPublishers } from "../../src/lib/catalog/publishers";
import {
  discoveryBand,
  meetsBuzz,
  sampleSpread,
  selectCatalogBatch,
  type Candidate,
  type DiscoveryBand,
} from "../../src/lib/catalog/select";
import { assertGeminiReady } from "./gemini";
import { ensureEvaluationTaxonomy, importSteamEvaluations } from "./import-reviews";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

const cacheDir = path.join(process.cwd(), "prisma", "catalog", ".cache");
const dryRun = catalogIsDryRun(process.argv, process.env);

const platforms = [
  ["pc", "PC"],
  ["playstation-5", "PlayStation 5"],
  ["xbox-series", "Xbox Series X|S"],
  ["switch", "Nintendo Switch"],
] as const;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function mapPool<T>(items: T[], limit: number, worker: (item: T) => Promise<void>) {
  let next = 0;
  async function run() {
    while (next < items.length) {
      const index = next;
      next += 1;
      await worker(items[index]);
    }
  }
  const workers = Math.min(limit, items.length);
  if (workers === 0) return;
  await Promise.all(Array.from({ length: workers }, () => run()));
}

async function fetchJson(url: string): Promise<unknown> {
  const headers = {
    Accept: "application/json",
    "Accept-Language": "en-US,en;q=0.9",
    "User-Agent": "FrameCatalog/0.1",
  };
  let lastStatus = 0;
  for (let attempt = 0; attempt < 6; attempt += 1) {
    await sleep(attempt === 0 ? 200 : 2000 * 2 ** (attempt - 1));
    const response = await fetch(url, { headers, signal: AbortSignal.timeout(30000) });
    if (response.ok) return response.json();
    lastStatus = response.status;
    if (response.status !== 429 && response.status !== 503) break;
  }
  throw new Error(`${lastStatus} for ${url}`);
}

function readCache<T>(file: string): T | null {
  if (!fs.existsSync(file)) return null;
  return JSON.parse(fs.readFileSync(file, "utf8")) as T;
}

function writeCache(file: string, value: unknown) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(value));
}

function iso(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function searchUrl(start: number): string {
  const params = new URLSearchParams({
    json: "1",
    category1: "998",
    supportedlang: "english",
    ndl: "1",
    sort_by: "Released_DESC",
    ignore_preferences: "1",
    infinite: "1",
    count: "100",
    start: String(start),
  });
  return `https://store.steampowered.com/search/results/?${params}`;
}

type DatedHit = { appId: number; releasedOn: string; tagIds: number[] };

function dedupe(hits: DatedHit[]) {
  const byId = new Map<number, DatedHit>();
  for (const hit of hits) {
    const current = byId.get(hit.appId);
    if (!current || hit.releasedOn < current.releasedOn) byId.set(hit.appId, hit);
  }
  return [...byId.values()];
}

async function discover(anchor: string, floor: string) {
  const bands: Record<DiscoveryBand, DatedHit[]> = {
    new: [],
    recent: [],
    settled: [],
    campaign: [],
  };
  let start = 0;
  let oldestReached: string | null = null;
  for (let page = 0; page < 200; page += 1) {
    const payload = await fetchJson(searchUrl(start));
    const { hits } = parseSearchPage(payload);
    if (hits.length === 0) break;
    let oldest: string | null = null;
    let dated = 0;
    for (const hit of hits) {
      if (!hit.releasedOn) continue;
      dated += 1;
      if (!oldest || hit.releasedOn < oldest) oldest = hit.releasedOn;
      if (!oldestReached || hit.releasedOn < oldestReached) oldestReached = hit.releasedOn;
      const band = discoveryBand(hit.releasedOn, anchor, floor);
      if (band) bands[band].push({ appId: hit.appId, releasedOn: hit.releasedOn, tagIds: hit.tagIds });
    }
    if (dated === 0) throw new Error("Steam search results did not include release dates.");
    if (page % 10 === 0) console.log(`Searched ${start + hits.length} store results. Oldest date on this page: ${oldest ?? "unknown"}.`);
    if (oldest && oldest < floor) break;
    if (hits.length < 100 && (!oldest || oldest <= anchor)) break;
    if (hits.length < 100) console.log(`Short page of ${hits.length} at offset ${start}. Oldest date ${oldest} is still after ${anchor}, so the search continues.`);
    start += 100;
  }

  const chosen = new Map<number, DatedHit>();
  const byDate = (hits: DatedHit[]) => dedupe(hits).sort((left, right) => (left.releasedOn < right.releasedOn ? 1 : -1));
  const campaign = byDate(bands.campaign);
  const settled = byDate(bands.settled);
  for (const hit of [
    ...byDate(bands.new),
    ...byDate(bands.recent),
    ...sampleSpread(settled, HYDRATION_PER_BAND),
    ...sampleSpread(campaign, CAMPAIGN_SAMPLE),
  ]) {
    chosen.set(hit.appId, hit);
  }
  return { games: chosen, oldestReached };
}

async function popularTags() {
  const file = path.join(cacheDir, "popular-tags.json");
  const cached = readCache<unknown>(file);
  if (cached) return parsePopularTags(cached);
  const payload = await fetchJson("https://store.steampowered.com/tagdata/populartags/english");
  writeCache(file, payload);
  return parsePopularTags(payload);
}

async function appDetails(appId: number) {
  const file = path.join(cacheDir, `app-${appId}.json`);
  const cached = readCache<ReturnType<typeof parseAppDetails>>(file);
  if (cached) return cached;
  const payload = await fetchJson(`https://store.steampowered.com/api/appdetails?appids=${appId}&l=english`);
  const details = parseAppDetails(appId, payload);
  if (details) writeCache(file, details);
  return details;
}

async function reviewSummary(appId: number): Promise<ReviewSummary | null> {
  const file = path.join(cacheDir, `summary-${appId}.json`);
  const cached = readCache<ReviewSummary>(file);
  if (cached) return cached;
  const url = `https://store.steampowered.com/appreviews/${appId}?json=1&language=all&purchase_type=all&num_per_page=0&filter=summary`;
  const summary = parseReviewSummary(await fetchJson(url));
  if (summary) writeCache(file, summary);
  return summary;
}

async function playerCount(appId: number): Promise<number> {
  const file = path.join(cacheDir, `players-${appId}.json`);
  const cached = readCache<{ count: number }>(file);
  if (cached) return cached.count;
  const count = parsePlayerCount(
    await fetchJson(`https://api.steampowered.com/ISteamUserStats/GetNumberOfCurrentPlayers/v1/?appid=${appId}`),
  );
  writeCache(file, { count });
  return count;
}

function unique(values: string[]): string[] {
  const seen = new Set<string>();
  const names: string[] = [];
  for (const value of values) {
    const key = value.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    names.push(value);
  }
  return names;
}

async function creatorId(name: string, cache: Map<string, string>) {
  const slug = slugify(name);
  const cached = cache.get(slug);
  if (cached) return cached;
  const existing = await prisma.creator.findUnique({ where: { slug } });
  const id = existing?.id ?? (await prisma.creator.create({ data: { slug, name } })).id;
  cache.set(slug, id);
  return id;
}

async function main() {
  if (!dryRun) {
    if (!process.env.GEMINI_API_KEY?.trim()) throw new Error("GEMINI_API_KEY is missing. Refusing to write a catalog with no evaluations.");
    await assertGeminiReady();
  }
  const floor = CAMPAIGN_FLOOR;
  const last = await prisma.catalogBatch.findFirst({ orderBy: { createdAt: "desc" } });
  if (last && iso(last.nextAnchor) <= floor) {
    console.log(`2026 catalog is complete. The next anchor ${iso(last.nextAnchor)} is on or before ${floor}.`);
    return;
  }
  const anchor = last ? iso(last.nextAnchor) : initialAnchor(todayIso(), INITIAL_ANCHOR_LAG_DAYS);
  if (anchor <= floor) {
    console.log(`2026 catalog is complete. The next anchor ${anchor} is on or before ${floor}.`);
    return;
  }

  console.log(
    dryRun
      ? "Dry run. The database will not be changed."
      : `This run will write games and up to ${REVIEWS_PER_GAME} imported Steam evaluations for each game.`,
  );
  console.log(`Catalog anchor ${anchor}. Floor ${floor}.`);
  const [found, tags] = await Promise.all([discover(anchor, floor), popularTags()]);
  const discovered = found.games;
  const existing = new Set(
    (await prisma.work.findMany({ where: { steamAppId: { not: null } }, select: { steamAppId: true } }))
      .map((work) => work.steamAppId)
      .filter((id): id is number => id !== null),
  );
  const supplement = parseConsoleReleases(
    JSON.parse(fs.readFileSync(path.join(process.cwd(), "prisma", "catalog", "console-releases.json"), "utf8")),
  );

  const candidates: Candidate[] = [];
  let hydrated = 0;
  const pending = [...discovered.entries()].filter(([appId]) => !existing.has(appId));
  console.log(`Reading store pages for ${pending.length} games.`);
  await mapPool(pending, 3, async ([appId, hit]) => {
    try {
      const details = await appDetails(appId);
      hydrated += 1;
      if (hydrated % 25 === 0) console.log(`Read ${hydrated} store pages.`);
      if (!details || details.type !== "game" || details.comingSoon || !details.windows || !details.releasedOn) return;
      if (details.releasedOn < floor || details.releasedOn > anchor) return;
      const tagNames = hit.tagIds.map((id) => tags.get(id)).filter((name): name is string => Boolean(name));
      const labels = mapSteamLabels([...details.genres, ...details.categories, ...tagNames]);
      if (!labels.primary) return;
      const consoles = supplement[appId] ?? [];
      candidates.push({
        steamAppId: appId,
        releasedOn: details.releasedOn,
        tier: tierForPublishers(details.publishers),
        primaryGenre: labels.primary,
        reviewCount: 0,
        currentPlayers: 0,
        platforms: ["pc", ...consoles.map((release) => release.platform)],
      });
    } catch (error) {
      console.error(`Skipped app ${appId}: ${error instanceof Error ? error.message : "request failed"}`);
    }
  });

  for (const candidate of candidates) {
    if (discoveryBand(candidate.releasedOn, anchor, floor) !== "new" || candidate.tier !== "INDIE") continue;
    try {
      const summary = await reviewSummary(candidate.steamAppId);
      candidate.reviewCount = summary?.totalCount ?? 0;
      if (!meetsBuzz(candidate)) candidate.currentPlayers = await playerCount(candidate.steamAppId);
    } catch (error) {
      console.error(`Skipped buzz signals for ${candidate.steamAppId}: ${error instanceof Error ? error.message : "request failed"}`);
    }
  }

  const genreRows = await prisma.workGenre.groupBy({
    by: ["genreId"],
    where: { isPrimary: true },
    _count: { _all: true },
  });
  const genreIds = await prisma.genre.findMany({ select: { id: true, slug: true } });
  const slugById = new Map(genreIds.map((genre) => [genre.id, genre.slug]));
  const catalogGenreCounts: Record<string, number> = {};
  for (const row of genreRows) {
    const slug = slugById.get(row.genreId);
    if (slug) catalogGenreCounts[slug] = row._count._all;
  }

  const selection = selectCatalogBatch({
    anchor,
    floor,
    candidates,
    excludedAppIds: [...existing],
    catalogGenreCounts,
  });

  console.log(`Next anchor ${selection.nextAnchor}${selection.campaignComplete ? " (campaign complete after this batch)" : ""}.`);
  console.log(`Selected ${selection.placements.length} games.`);
  for (const shortfall of selection.shortfalls) console.log(`Shortfall ${shortfall.slot}: ${shortfall.missing}`);

  if (selection.placements.length === 0 && found.oldestReached && found.oldestReached > anchor) {
    console.log(`Steam search stopped at ${found.oldestReached}, before the anchor ${anchor}. Nothing was written, and the date stays ${anchor}.`);
    return;
  }

  if (dryRun) {
    for (const placement of selection.placements) {
      const candidate = candidates.find((item) => item.steamAppId === placement.steamAppId);
      console.log(
        `${placement.slot}\t${placement.primaryGenre}\t${placement.releasedOn}\t${placement.steamAppId}\t${candidate?.tier ?? ""}`,
      );
    }
    console.log("Dry run. Nothing was written.");
    return;
  }

  await ensureEvaluationTaxonomy(prisma);
  for (const genre of CANONICAL_GENRES) {
    await prisma.genre.upsert({ where: { slug: genre.slug }, update: { name: genre.name }, create: genre });
  }
  for (const [slug, name] of platforms) {
    await prisma.platform.upsert({ where: { slug }, update: { name }, create: { slug, name } });
  }
  const region = await prisma.region.upsert({
    where: { code: "WORLDWIDE" },
    update: {},
    create: { code: "WORLDWIDE", name: "Worldwide" },
  });
  const genreId = new Map((await prisma.genre.findMany()).map((genre) => [genre.slug, genre.id]));
  const platformId = new Map((await prisma.platform.findMany()).map((platform) => [platform.slug, platform.id]));
  const creators = new Map<string, string>();
  const usedSlugs = new Set((await prisma.work.findMany({ where: { workType: "GAME" }, select: { slug: true } })).map((work) => work.slug));

  const written: { workId: string; placement: (typeof selection.placements)[number] }[] = [];
  for (const placement of selection.placements) {
    const details = await appDetails(placement.steamAppId);
    if (!details) continue;
    const hit = discovered.get(placement.steamAppId);
    const steamTags = (hit?.tagIds ?? []).map((id) => tags.get(id)).filter((name): name is string => Boolean(name));
    const labels = mapSteamLabels([...details.genres, ...details.categories, ...steamTags]);
    if (!labels.primary) continue;
    let slug = slugify(details.title);
    if (usedSlugs.has(slug)) slug = `${slugify(details.title).slice(0, 60)}-${placement.steamAppId}`;
    usedSlugs.add(slug);
    const summary = await reviewSummary(placement.steamAppId).catch(() => null);
    const developerIds = [];
    for (const name of unique(details.developers.map(publicCreditName))) developerIds.push({ id: await creatorId(name, creators), role: "DEVELOPER" as const });
    const publisherIds = [];
    for (const name of unique(details.publishers.map(publicCreditName))) publisherIds.push({ id: await creatorId(name, creators), role: "PUBLISHER" as const });
    const consoles = supplement[placement.steamAppId] ?? [];
    const releaseRows = [
      { platformId: platformId.get("pc"), releasedOn: asUtcDate(details.releasedOn ?? placement.releasedOn) },
      ...consoles.map((release) => ({ platformId: platformId.get(release.platform), releasedOn: asUtcDate(release.date) })),
    ].filter((release): release is { platformId: string; releasedOn: Date } => Boolean(release.platformId));
    const storedTags = unique([...steamTags, ...details.genres, ...details.categories]).slice(0, 20);

    try {
      const work = await prisma.work.create({
        data: {
          steamAppId: placement.steamAppId,
          slug,
          title: details.title,
          workType: "GAME",
          status: "PUBLISHED",
          synopsis: details.synopsis || null,
          creators: {
            create: [...developerIds, ...publisherIds].map((creator, index) => ({
              creatorId: creator.id,
              role: creator.role,
              sortOrder: index,
            })),
          },
          genres: {
            create: [labels.primary, ...labels.secondary].filter((item): item is string => Boolean(item && genreId.get(item))).map((item) => ({
              genreId: genreId.get(item)!,
              isPrimary: item === labels.primary,
            })),
          },
          platforms: {
            create: [...new Set(releaseRows.map((release) => release.platformId))].map((id) => ({ platformId: id })),
          },
          releases: {
            create: releaseRows.map((release) => ({
              platformId: release.platformId,
              regionId: region.id,
              releasedOn: release.releasedOn,
              status: "RELEASED" as const,
            })),
          },
          media: details.headerImage
            ? {
                create: {
                  kind: "KEY_ART" as const,
                  src: details.headerImage,
                  alt: `Key art for ${details.title}`,
                  isPrimary: true,
                },
              }
            : undefined,
          tags: {
            create: await Promise.all(
              storedTags.map(async (name) => {
                const tagSlug = slugify(name);
                const tag = await prisma.tag.upsert({ where: { slug: tagSlug }, update: { name }, create: { slug: tagSlug, name } });
                return { tagId: tag.id };
              }),
            ),
          },
          steamReception: summary
            ? {
                create: {
                  label: summary.label,
                  positiveCount: summary.positiveCount,
                  negativeCount: summary.negativeCount,
                  totalCount: summary.totalCount,
                  fetchedAt: new Date(),
                  storeUrl: `https://store.steampowered.com/app/${placement.steamAppId}`,
                  reviewsUrl: `https://steamcommunity.com/app/${placement.steamAppId}/reviews/`,
                },
              }
            : undefined,
        },
      });
      written.push({ workId: work.id, placement });
      console.log(`Added ${details.title}`);
      const imported = await importSteamEvaluations(prisma, {
        workId: work.id,
        steamAppId: placement.steamAppId,
        title: details.title,
        platformId: platformId.get("pc") ?? null,
      });
      console.log(`Imported ${imported} evaluations for ${details.title}`);
    } catch (error) {
      console.error(`Could not save ${details.title}: ${error instanceof Error ? error.message : "write failed"}`);
    }
  }

  if (selection.placements.length > 0 && written.length === 0) {
    throw new Error("No games were written. The cursor was left in place.");
  }

  await prisma.catalogBatch.create({
    data: {
      anchor: asUtcDate(anchor),
      nextAnchor: asUtcDate(selection.nextAnchor),
      campaignComplete: selection.campaignComplete,
      shortfalls: selection.shortfalls,
      placements: {
        create: written.map(({ workId, placement }) => ({
          workId,
          slot: placement.slot as CatalogSlot,
          primaryGenreSlug: placement.primaryGenre,
          windowWidened: placement.windowWidened,
          buzzMet: placement.buzzMet,
          releasedOn: asUtcDate(placement.releasedOn),
        })),
      },
    },
  });
  console.log(`Wrote ${written.length} games. Run the command again to continue toward ${floor}.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
