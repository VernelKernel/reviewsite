import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { assertValidWorkRelation } from "../src/lib/domain/relations";
import { dimensions, genres, platforms, relations, reviewers, topics, works } from "./seed/catalog";
import { coverSvg } from "./seed/covers";
import { evaluations } from "./seed/evaluations";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

const regions = [{ code: "WORLDWIDE", name: "Worldwide" }];

async function clear() {
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
  await prisma.release.deleteMany();
  await prisma.workPlatform.deleteMany();
  await prisma.workGenre.deleteMany();
  await prisma.workCreator.deleteMany();
  await prisma.workTitle.deleteMany();
  await prisma.work.deleteMany();
  await prisma.reviewerProfile.deleteMany();
  await prisma.authenticationIdentity.deleteMany();
  await prisma.user.deleteMany();
  await prisma.dimension.deleteMany();
  await prisma.topic.deleteMany();
  await prisma.genre.deleteMany();
  await prisma.platform.deleteMany();
  await prisma.region.deleteMany();
  await prisma.creator.deleteMany();
}

async function main() {
  await clear();

  await prisma.region.createMany({ data: regions });
  const region = await prisma.region.findUniqueOrThrow({ where: { code: "WORLDWIDE" } });

  await prisma.platform.createMany({
    data: platforms.map(([slug, name]) => ({ slug, name })),
  });
  await prisma.genre.createMany({
    data: genres.map(([slug, name]) => ({ slug, name })),
  });
  await prisma.topic.createMany({
    data: topics.map(([slug, name]) => ({ slug, name })),
  });
  await prisma.dimension.createMany({ data: dimensions });

  const platformBySlug = new Map((await prisma.platform.findMany()).map((platform) => [platform.slug, platform.id]));
  const genreBySlug = new Map((await prisma.genre.findMany()).map((genre) => [genre.slug, genre.id]));
  const topicBySlug = new Map((await prisma.topic.findMany()).map((topic) => [topic.slug, topic.id]));
  const dimensionBySlug = new Map((await prisma.dimension.findMany()).map((dimension) => [dimension.slug, dimension.id]));

  for (const reviewer of reviewers) {
    await prisma.user.create({
      data: {
        email: reviewer.email,
        identities: { create: { provider: "EMAIL", providerAccountId: reviewer.email } },
        profile: { create: { slug: reviewer.slug, displayName: reviewer.name, bio: reviewer.bio } },
      },
    });
  }
  const reviewerBySlug = new Map((await prisma.reviewerProfile.findMany()).map((profile) => [profile.slug, profile.id]));

  const creatorIds = new Map<string, string>();
  for (const work of works) {
    for (const creator of work.creators) {
      if (creatorIds.has(creator.slug)) continue;
      const created = await prisma.creator.create({ data: { slug: creator.slug, name: creator.name } });
      creatorIds.set(creator.slug, created.id);
    }
  }

  const mediaDir = path.join(process.cwd(), "public", "media");
  fs.mkdirSync(mediaDir, { recursive: true });

  const workIds = new Map<string, string>();
  for (const work of works) {
    fs.writeFileSync(path.join(mediaDir, `${work.slug}.svg`), coverSvg(work.art, work.art.motif));
    const created = await prisma.work.create({
      data: {
        slug: work.slug,
        title: work.title,
        workType: work.workType,
        status: "PUBLISHED",
        synopsis: work.synopsis,
        alternateTitles: {
          create: (work.alternateTitles ?? []).map((title) => ({ title })),
        },
        creators: {
          create: work.creators.map((creator, index) => ({
            creatorId: creatorIds.get(creator.slug)!,
            role: creator.role,
            sortOrder: index,
          })),
        },
        genres: {
          create: work.genres.map((slug) => ({ genreId: genreBySlug.get(slug)! })),
        },
        platforms: {
          create: work.platforms.map((slug) => ({ platformId: platformBySlug.get(slug)! })),
        },
        releases: {
          create: work.releases.map((release) => ({
            platformId: release.platform ? platformBySlug.get(release.platform) : undefined,
            regionId: region.id,
            releasedOn: new Date(`${release.date}T00:00:00.000Z`),
            status: release.status ?? "RELEASED",
            label: release.label,
          })),
        },
        media: {
          create: {
            kind: work.workType === "MOVIE" ? "POSTER" : "KEY_ART",
            src: `/media/${work.slug}.svg`,
            alt: `Abstract key art for ${work.title}`,
            isPrimary: true,
          },
        },
      },
    });
    workIds.set(work.slug, created.id);
  }

  for (const relation of relations) {
    const fromWorkId = workIds.get(relation.from)!;
    const toWorkId = workIds.get(relation.to)!;
    assertValidWorkRelation(fromWorkId, toWorkId);
    await prisma.workRelation.create({
      data: { fromWorkId, toWorkId, kind: relation.kind },
    });
  }

  for (const evaluation of evaluations) {
    const workId = workIds.get(evaluation.work);
    const reviewerId = reviewerBySlug.get(evaluation.reviewer);
    if (!workId || !reviewerId) throw new Error(`Missing work or reviewer for ${evaluation.work} / ${evaluation.reviewer}`);

    const judgmentData = Object.entries(evaluation.judgments).map(([slug, stance]) => {
      const dimensionId = dimensionBySlug.get(slug);
      if (!dimensionId) throw new Error(`Unknown dimension ${slug} on ${evaluation.work}`);
      return { dimensionId, stance };
    });

    const observationData = (evaluation.observations ?? []).map((observation) => {
      const topicId = topicBySlug.get(observation.topic);
      if (!topicId) throw new Error(`Unknown topic ${observation.topic}`);
      return { topicId, polarity: observation.polarity, content: observation.content };
    });

    await prisma.evaluation.create({
      data: {
        workId,
        reviewerId,
        status: "PUBLISHED",
        reviewedOn: new Date(`${evaluation.reviewedOn}T00:00:00.000Z`),
        lens: evaluation.lens,
        standard: evaluation.standard,
        standardNote: evaluation.standardNote,
        enjoyment: evaluation.enjoyment,
        execution: evaluation.execution,
        completion: evaluation.completion,
        playtime: evaluation.playtime,
        ownership: evaluation.ownership,
        platformId: evaluation.platform ? platformBySlug.get(evaluation.platform) : undefined,
        review: {
          create: {
            title: evaluation.title,
            body: evaluation.body,
            source: evaluation.imported ? "IMPORTED" : "INTERNAL",
            importSourceName: evaluation.imported?.name,
            importSourceUrl: evaluation.imported?.url,
          },
        },
        judgments: { create: judgmentData },
        observations: { create: observationData },
      },
    });
  }

  console.log(`Seeded ${works.length} works and ${evaluations.length} evaluations.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
