import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../src/generated/prisma/client";
import { catalogIsDryRun } from "../../src/lib/catalog/run-mode";
import { fetchSteamPortraits } from "../../src/lib/catalog/steam-title";

const dryRun = catalogIsDryRun(process.argv, process.env);
const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

async function main() {
  const works = await prisma.work.findMany({
    where: { steamAppId: { not: null } },
    select: { id: true, title: true, steamAppId: true, media: { where: { kind: "POSTER" }, select: { id: true, src: true } } },
    orderBy: { title: "asc" },
  });
  console.log(dryRun ? "Dry run. The database will not be changed." : "Syncing Steam cover art.");
  console.log(`${works.length} Steam games to check.`);

  let added = 0;
  let refreshed = 0;
  let missing = 0;
  for (let start = 0; start < works.length; start += 50) {
    const batch = works.slice(start, start + 50);
    const portraits = await fetchSteamPortraits(batch.map((work) => work.steamAppId!));
    for (const work of batch) {
      const src = portraits.get(work.steamAppId!);
      if (!src) {
        missing += 1;
        console.log(`${work.title}: Steam lists no cover art.`);
        continue;
      }
      const current = work.media[0];
      if (current?.src === src) continue;
      if (current) {
        if (!dryRun) await prisma.mediaAsset.update({ where: { id: current.id }, data: { src } });
        refreshed += 1;
      } else {
        if (!dryRun) {
          await prisma.mediaAsset.create({
            data: { workId: work.id, kind: "POSTER", src, alt: `Cover art for ${work.title}`, sortOrder: 1 },
          });
        }
        added += 1;
      }
    }
  }
  const verb = dryRun ? "Would add" : "Added";
  console.log(`${verb} cover art for ${added} games and ${dryRun ? "would refresh" : "refreshed"} ${refreshed}. ${missing} have none on Steam.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
