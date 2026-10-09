import type { WorkType } from "@/generated/prisma/client";
import { mapSteamLabels } from "../catalog/genres";
import { slugify } from "../catalog/parse";
import { fetchSteamApp, SteamLookupError } from "../catalog/steam-title";
import { prisma } from "../db/client";
import { readJudgments, type StoredJudgment } from "./judgments";
import { normalizeTitle } from "./normalize";

export class AttachBlocked extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AttachBlocked";
  }
}

export class SteamNotAGame extends Error {
  constructor() {
    super("Steam did not return a game for that app.");
    this.name = "SteamNotAGame";
  }
}

type AttachIntake = {
  id: string;
  rawTitle: string;
  normalizedTitle: string;
  rawPlatform: string | null;
  enjoyment: "POSITIVE" | "MIXED" | "NEGATIVE";
  execution: "POSITIVE" | "MIXED" | "NEGATIVE";
  completion: "JUST_STARTED" | "EARLY" | "SUBSTANTIAL" | "COMPLETED" | "ENDGAME" | "POST_GAME" | "ABANDONED" | "UNKNOWN";
  reviewBody: string | null;
  judgments: unknown;
  workType: WorkType;
};

export async function ensureSteamWork(appId: number): Promise<string> {
  const existing = await prisma.work.findUnique({ where: { steamAppId: appId }, select: { id: true } });
  if (existing) return existing.id;
  const details = await fetchSteamApp(appId);
  if (!details) throw new SteamLookupError("Steam did not return details for that app.");
  if (details.type && details.type !== "game") throw new SteamNotAGame();

  const labels = mapSteamLabels([...details.genres, ...details.categories]);
  const genreSlugs = [labels.primary, ...labels.secondary].filter((slug): slug is string => Boolean(slug));
  const genres = genreSlugs.length ? await prisma.genre.findMany({ where: { slug: { in: genreSlugs } } }) : [];
  const pc = details.windows ? await prisma.platform.findUnique({ where: { slug: "pc" } }) : null;
  const base = slugify(details.title);
  const collision = await prisma.work.findFirst({ where: { workType: "GAME", slug: base }, select: { id: true } });
  const slug = collision ? `${base.slice(0, 60)}-${appId}` : base;

  try {
    const work = await prisma.work.create({
      data: {
        steamAppId: appId,
        slug,
        title: details.title,
        workType: "GAME",
        status: "UNLISTED",
        synopsis: details.synopsis || null,
        genres: {
          create: genres.map((genre) => ({
            genreId: genre.id,
            isPrimary: genre.slug === labels.primary,
          })),
        },
        platforms: pc ? { create: [{ platformId: pc.id }] } : undefined,
        media: details.headerImage
          ? {
              create: {
                kind: "KEY_ART",
                src: details.headerImage,
                alt: `Key art for ${details.title}`,
                isPrimary: true,
              },
            }
          : undefined,
      },
      select: { id: true },
    });
    return work.id;
  } catch (error) {
    const raced = await prisma.work.findUnique({ where: { steamAppId: appId }, select: { id: true } });
    if (raced) return raced.id;
    throw error instanceof SteamLookupError ? error : new SteamLookupError("The Steam work could not be saved.");
  }
}

export async function attachIntakeToWork(intake: AttachIntake, workId: string, reviewerId: string): Promise<void> {
  const work = await prisma.work.findUnique({ where: { id: workId }, select: { id: true, title: true, workType: true } });
  if (!work || work.workType !== intake.workType) {
    await markIntake(intake.id, "UNMATCHED", "The matched work is no longer available.");
    return;
  }

  const dimensions = await prisma.dimension.findMany({
    where: { appliesTo: { has: work.workType } },
    select: { id: true },
  });
  const allowed = new Set(dimensions.map((dimension) => dimension.id));
  const judgments = readJudgments(intake.judgments).filter((judgment) => allowed.has(judgment.dimensionId));
  const platform = await matchedPlatform(intake.rawPlatform);

  try {
    await prisma.$transaction(async (tx) => {
      const existing = await tx.evaluation.findUnique({
        where: { reviewerId_workId: { reviewerId, workId: work.id } },
      });
      if (existing && (existing.status === "HIDDEN" || existing.status === "REMOVED")) {
        throw new AttachBlocked("This evaluation is not open for changes.");
      }
      const saved = existing
        ? await tx.evaluation.update({
            where: { id: existing.id },
            data: {
              status: "PUBLISHED",
              enjoyment: intake.enjoyment,
              execution: intake.execution,
              completion: intake.completion,
              platformId: platform?.id ?? existing.platformId,
              reviewedOn: existing.reviewedOn ?? new Date(),
            },
          })
        : await tx.evaluation.create({
            data: {
              workId: work.id,
              reviewerId,
              status: "PUBLISHED",
              enjoyment: intake.enjoyment,
              execution: intake.execution,
              completion: intake.completion,
              platformId: platform?.id ?? null,
              reviewedOn: new Date(),
            },
          });

      await tx.evaluationJudgment.deleteMany({ where: { evaluationId: saved.id } });
      if (judgments.length > 0) {
        await tx.evaluationJudgment.createMany({
          data: judgments.map((judgment: StoredJudgment) => ({
            evaluationId: saved.id,
            dimensionId: judgment.dimensionId,
            stance: judgment.stance,
          })),
        });
      }

      const body = intake.reviewBody?.trim();
      if (body) {
        await tx.review.upsert({
          where: { evaluationId: saved.id },
          update: { body, source: "INTERNAL" },
          create: { evaluationId: saved.id, body, source: "INTERNAL" },
        });
      }

      if (normalizeTitle(work.title) !== intake.normalizedTitle) {
        const aliases = await tx.workTitle.findMany({ where: { workId: work.id }, select: { title: true } });
        const known = aliases.some((alias) => normalizeTitle(alias.title) === intake.normalizedTitle);
        if (!known) await tx.workTitle.create({ data: { workId: work.id, title: intake.rawTitle } });
      }

      await tx.intake.update({
        where: { id: intake.id },
        data: {
          matchStatus: "MATCHED",
          matchNote: `Matched to ${work.title}.`,
          workId: work.id,
          evaluationId: saved.id,
        },
      });
    });
  } catch (error) {
    if (error instanceof AttachBlocked) {
      await markIntake(intake.id, "FAILED", error.message);
      return;
    }
    throw error;
  }
}

async function matchedPlatform(raw: string | null) {
  const name = raw?.trim();
  if (!name) return null;
  return prisma.platform.findFirst({
    where: {
      OR: [{ name: { equals: name, mode: "insensitive" } }, { slug: name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") }],
    },
    select: { id: true },
  });
}

export async function markIntake(
  id: string,
  matchStatus: "PENDING" | "MATCHED" | "UNMATCHED" | "AMBIGUOUS" | "FAILED",
  matchNote: string,
) {
  await prisma.intake.update({ where: { id }, data: { matchStatus, matchNote } });
}
