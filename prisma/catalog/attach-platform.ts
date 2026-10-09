import type { PrismaClient } from "../../src/generated/prisma/client";
import { reviewPlatformName, type ReviewPlatformSlug } from "../../src/lib/catalog/interpret";

export async function attachReviewedPlatform(
  prisma: PrismaClient,
  workId: string,
  title: string,
  slug: ReviewPlatformSlug | null,
): Promise<string | null> {
  if (!slug) return null;
  const name = reviewPlatformName(slug);
  const platform = await prisma.platform.upsert({
    where: { slug },
    update: {},
    create: { slug, name },
  });
  const linked = await prisma.workPlatform.findUnique({
    where: { workId_platformId: { workId, platformId: platform.id } },
  });
  if (!linked) {
    await prisma.workPlatform.create({ data: { workId, platformId: platform.id } });
    console.log(`${title} · ${name} added to the work`);
  }
  return platform.id;
}
