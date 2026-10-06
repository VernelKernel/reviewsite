import { MIN_REVIEW_CHARS, REVIEWS_PER_GAME } from "../../src/lib/catalog/config";
import { dimensions, topics } from "../seed/catalog";
import type { PrismaClient } from "../../src/generated/prisma/client";
import { slugify } from "../../src/lib/catalog/parse";
import {
  ownershipFromSteam,
  parseSteamPersona,
  parseSteamReviews,
  playtimeBucket,
  reviewPageState,
  selectSteamReviews,
  steamProfileUrl,
  steamReviewUrl,
  type SteamReview,
} from "../../src/lib/catalog/reviews";
import { GeminiError, interpretReview } from "./gemini";

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchText(url: string): Promise<string> {
  await sleep(200);
  let response = await fetch(url, {
    headers: { Accept: "application/xml,text/xml,application/json", "User-Agent": "FrameCatalog/0.1" },
    signal: AbortSignal.timeout(30000),
  });
  if (response.status === 429 || response.status === 503) {
    await sleep(2000);
    response = await fetch(url, {
      headers: { Accept: "application/xml,text/xml,application/json", "User-Agent": "FrameCatalog/0.1" },
      signal: AbortSignal.timeout(30000),
    });
  }
  if (!response.ok) throw new Error(`${response.status} for ${url}`);
  return response.text();
}

const personas = new Map<string, string>();

async function personaName(steamId: string): Promise<string> {
  const cached = personas.get(steamId);
  if (cached) return cached;
  let name = `Steam user ${steamId.slice(-4)}`;
  try {
    const xml = await fetchText(`${steamProfileUrl(steamId)}?xml=1`);
    name = parseSteamPersona(xml) ?? name;
  } catch (error) {
    console.error(`Could not read Steam name ${steamId}: ${error instanceof Error ? error.message : "request failed"}`);
  }
  personas.set(steamId, name);
  return name;
}

async function uniqueSlug(prisma: PrismaClient, displayName: string, steamId: string): Promise<string> {
  const base = slugify(displayName);
  let slug = base;
  let suffix = 2;
  while (await prisma.reviewerProfile.findUnique({ where: { slug } })) {
    slug = suffix === 2 ? `${base}-${steamId.slice(-4)}` : `${base}-${steamId.slice(-4)}-${suffix}`;
    suffix += 1;
  }
  return slug;
}

async function reviewerFor(prisma: PrismaClient, review: SteamReview) {
  const existing = await prisma.authenticationIdentity.findUnique({
    where: { provider_providerAccountId: { provider: "STEAM", providerAccountId: review.steamId } },
    include: { user: { include: { profile: true } } },
  });
  if (existing?.user.profile) return existing.user.profile;

  const displayName = await personaName(review.steamId);
  const email = `steam-${review.steamId}@users.invalid`;
  const user =
    existing?.user ??
    (await prisma.user.create({
      data: {
        email,
        identities: { create: { provider: "STEAM", providerAccountId: review.steamId } },
      },
    }));
  return prisma.reviewerProfile.create({
    data: {
      userId: user.id,
      slug: await uniqueSlug(prisma, displayName, review.steamId),
      displayName,
      bio: `Reviews imported from their Steam profile: ${steamProfileUrl(review.steamId)}`,
    },
  });
}

export async function ensureEvaluationTaxonomy(prisma: PrismaClient) {
  for (const dimension of dimensions) {
    await prisma.dimension.upsert({
      where: { slug: dimension.slug },
      update: { name: dimension.name, sortOrder: dimension.sortOrder, appliesTo: dimension.appliesTo },
      create: dimension,
    });
  }
  for (const [slug, name] of topics) {
    await prisma.topic.upsert({ where: { slug }, update: { name }, create: { slug, name } });
  }
}

export type ReviewLoadOptions = {
  pages: number;
  pageSize: number;
  minChars: number;
  limit: number;
};

const defaultLoad: ReviewLoadOptions = {
  pages: 1,
  pageSize: 20,
  minChars: MIN_REVIEW_CHARS,
  limit: REVIEWS_PER_GAME,
};

function reviewPageUrl(appId: number, pageSize: number, cursor: string | null): string {
  const params = new URLSearchParams({
    json: "1",
    filter: "recent",
    language: "english",
    review_type: "all",
    purchase_type: "all",
    num_per_page: String(pageSize),
  });
  if (cursor) params.set("cursor", cursor);
  return `https://store.steampowered.com/appreviews/${appId}?${params}`;
}

export async function loadSteamReviews(
  appId: number,
  options: ReviewLoadOptions,
): Promise<{ reviews: SteamReview[]; total: number | null }> {
  const gathered: SteamReview[] = [];
  let cursor: string | null = null;
  let total: number | null = null;
  for (let page = 0; page < options.pages; page += 1) {
    const payload = JSON.parse(await fetchText(reviewPageUrl(appId, options.pageSize, cursor)));
    const state = reviewPageState(payload);
    if (total === null) total = state.total;
    gathered.push(...parseSteamReviews(payload));
    if (selectSteamReviews(gathered, options.limit, options.minChars).length >= options.limit) break;
    if (!state.cursor || state.cursor === cursor) break;
    cursor = state.cursor;
  }
  return { reviews: selectSteamReviews(gathered, options.limit, options.minChars), total };
}

export async function importSteamEvaluations(
  prisma: PrismaClient,
  input: { workId: string; steamAppId: number; title: string; platformId: string | null },
  options: ReviewLoadOptions = defaultLoad,
): Promise<number> {
  let selected: SteamReview[];
  try {
    selected = (await loadSteamReviews(input.steamAppId, options)).reviews;
  } catch (error) {
    console.error(`Could not read reviews for ${input.title}: ${error instanceof Error ? error.message : "request failed"}`);
    return 0;
  }
  const [dimensionIds, topicIds] = await Promise.all([
    prisma.dimension.findMany({ select: { id: true, slug: true } }),
    prisma.topic.findMany({ select: { id: true, slug: true } }),
  ]);
  const dimensionId = new Map(dimensionIds.map((dimension) => [dimension.slug, dimension.id]));
  const topicId = new Map(topicIds.map((topic) => [topic.slug, topic.id]));
  let imported = 0;

  for (const review of selected) {
    try {
      const reading = await interpretReview({
        title: input.title,
        body: review.body,
        votedUp: review.votedUp,
        playtimeMinutes: review.playtimeMinutes,
        earlyAccess: review.earlyAccess,
      });
      if (!reading) {
        console.error(`Skipped a review of ${input.title}: the reading did not match an evaluation.`);
        continue;
      }
      const profile = await reviewerFor(prisma, review);
      const already = await prisma.evaluation.findUnique({
        where: { reviewerId_workId: { reviewerId: profile.id, workId: input.workId } },
      });
      if (already) continue;
      await prisma.evaluation.create({
        data: {
          workId: input.workId,
          reviewerId: profile.id,
          status: "PUBLISHED",
          reviewedOn: review.createdAt ? new Date(review.createdAt * 1000) : null,
          lens: reading.lens,
          standard: reading.standard,
          standardNote: reading.standardNote,
          enjoyment: reading.enjoyment,
          execution: reading.execution,
          completion: reading.completion,
          playtime: playtimeBucket(review.playtimeMinutes),
          platformId: input.platformId,
          ownership: ownershipFromSteam(review),
          review: {
            create: {
              body: review.body,
              source: "IMPORTED",
              importSourceName: "Steam",
              importSourceUrl: steamReviewUrl(review.steamId, input.steamAppId),
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
      imported += 1;
      console.log(`Imported ${profile.displayName} on ${input.title}`);
    } catch (error) {
      if (error instanceof GeminiError && (error.status === 401 || error.status === 403)) throw error;
      console.error(`Skipped a review of ${input.title}: ${error instanceof Error ? error.message : "import failed"}`);
    }
  }
  return imported;
}
