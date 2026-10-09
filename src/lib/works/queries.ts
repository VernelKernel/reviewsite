import { Prisma, type WorkType } from "@/generated/prisma/client";
import { prisma } from "../db/client";

const publishedEvaluation = { status: "PUBLISHED" as const };

export const cardInclude = {
  media: {
    where: { visibility: "PUBLIC" as const },
    orderBy: { sortOrder: "asc" as const },
  },
  creators: {
    include: { creator: true },
    orderBy: { sortOrder: "asc" as const },
  },
  genres: { include: { genre: true } },
  platforms: { include: { platform: true } },
  releases: { orderBy: { releasedOn: "asc" as const } },
  evaluations: {
    where: publishedEvaluation,
    select: {
      enjoyment: true,
      execution: true,
      lens: true,
      standard: true,
      completion: true,
      population: true,
      review: { select: { importSourceName: true } },
      judgments: { include: { dimension: true } },
      observations: { include: { topic: true } },
    },
  },
} satisfies Prisma.WorkInclude;

export const workInclude = {
  alternateTitles: true,
  media: {
    where: { visibility: "PUBLIC" as const },
    orderBy: { sortOrder: "asc" as const },
  },
  creators: {
    include: { creator: true },
    orderBy: { sortOrder: "asc" as const },
  },
  genres: { include: { genre: true } },
  platforms: { include: { platform: true } },
  releases: {
    include: { platform: true, region: true },
    orderBy: { releasedOn: "asc" as const },
  },
  steamReception: true,
  relationsFrom: {
    include: { to: { select: { title: true, slug: true, workType: true, status: true } } },
  },
  relationsTo: {
    include: { from: { select: { title: true, slug: true, workType: true, status: true } } },
  },
  evaluations: {
    where: publishedEvaluation,
    orderBy: { reviewedOn: "desc" as const },
    include: {
      reviewer: true,
      platform: true,
      review: true,
      judgments: { include: { dimension: true } },
      observations: { include: { topic: true } },
    },
  },
} satisfies Prisma.WorkInclude;

export type CardWork = Prisma.WorkGetPayload<{ include: typeof cardInclude }>;
export type FullWork = Prisma.WorkGetPayload<{ include: typeof workInclude }>;

export async function listWorks(workType?: WorkType): Promise<CardWork[]> {
  return prisma.work.findMany({
    where: { status: "PUBLISHED", ...(workType ? { workType } : {}) },
    include: cardInclude,
    orderBy: { title: "asc" },
  });
}

export async function getWork(workType: WorkType, slug: string): Promise<FullWork | null> {
  return prisma.work.findUnique({
    where: { workType_slug: { workType, slug } },
    include: workInclude,
  });
}

export async function searchWorks(query: string): Promise<CardWork[]> {
  const q = query.trim();
  if (q.length < 2) return [];
  return prisma.work.findMany({
    where: {
      status: "PUBLISHED",
      OR: [
        { title: { contains: q, mode: "insensitive" } },
        { synopsis: { contains: q, mode: "insensitive" } },
        { alternateTitles: { some: { title: { contains: q, mode: "insensitive" } } } },
        { creators: { some: { creator: { name: { contains: q, mode: "insensitive" } } } } },
        { genres: { some: { genre: { name: { contains: q, mode: "insensitive" } } } } },
        { tags: { some: { tag: { name: { contains: q, mode: "insensitive" } } } } },
        {
          evaluations: {
            some: {
              status: "PUBLISHED",
              OR: [
                { review: { body: { contains: q, mode: "insensitive" } } },
                { observations: { some: { topic: { name: { contains: q, mode: "insensitive" } } } } },
              ],
            },
          },
        },
      ],
    },
    include: cardInclude,
    orderBy: { title: "asc" },
    take: 24,
  });
}

export async function worksSharingCreator(workId: string, creatorIds: string[]) {
  if (creatorIds.length === 0) return [];
  return prisma.work.findMany({
    where: {
      status: "PUBLISHED",
      id: { not: workId },
      creators: { some: { creatorId: { in: creatorIds }, role: "DEVELOPER" } },
    },
    select: { title: true, slug: true, workType: true },
    orderBy: { title: "asc" },
  });
}

export async function getReviewer(slug: string) {
  return prisma.reviewerProfile.findUnique({
    where: { slug },
    include: {
      evaluations: {
        where: { status: "PUBLISHED" },
        orderBy: { reviewedOn: "desc" },
        include: {
          work: { include: cardInclude },
          review: true,
          platform: true,
        },
      },
    },
  });
}

export async function recentEvaluations(take = 4) {
  return prisma.evaluation.findMany({
    where: { status: "PUBLISHED", review: { isNot: null } },
    orderBy: { reviewedOn: "desc" },
    take,
    include: {
      reviewer: true,
      review: true,
      work: { select: { title: true, slug: true, workType: true } },
    },
  });
}

export async function evaluationFormOptions(workType: WorkType) {
  const [dimensions, topics, platforms] = await Promise.all([
    prisma.dimension.findMany({
      where: { appliesTo: { has: workType } },
      orderBy: { sortOrder: "asc" },
    }),
    prisma.topic.findMany({ orderBy: { name: "asc" } }),
    prisma.platform.findMany({ orderBy: { name: "asc" } }),
  ]);
  return { dimensions, topics, platforms };
}
