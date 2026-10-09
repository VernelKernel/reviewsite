import type { Metadata } from "next";
import { ThinGameList } from "@/components/admin/thin-games";
import { getCurrentUser } from "@/lib/auth/session";
import { isThin, THIN_CRITIC_EVALUATIONS } from "@/lib/catalog/thin";
import { prisma } from "@/lib/db/client";

export const metadata: Metadata = {
  title: "Thin coverage",
  description: "Choose games with a thin critic sample and register publications the roster does not have yet.",
};

export default async function OutletAdminPage() {
  const user = await getCurrentUser();
  if (!user || (user.role !== "ADMIN" && user.role !== "EDITOR")) {
    return (
      <main className="page shell">
        <p className="kicker">Editor</p>
        <h1>Thin coverage</h1>
        <p className="lede">Sign in with an editor account to choose which thin games get a publication pass.</p>
      </main>
    );
  }

  const [works, counts, expansions, tracked] = await Promise.all([
    prisma.work.findMany({
      where: { status: "PUBLISHED", workType: "GAME" },
      orderBy: { title: "asc" },
      select: { id: true, title: true, slug: true },
    }),
    prisma.evaluation.groupBy({
      by: ["workId"],
      where: { population: "CRITIC", status: "PUBLISHED", work: { workType: "GAME", status: "PUBLISHED" } },
      _count: { _all: true },
    }),
    prisma.outletExpansion.findMany({ select: { workId: true, enabled: true } }),
    prisma.trackedOutlet.findMany({ orderBy: { createdAt: "desc" }, take: 40 }),
  ]);
  const countByWork = new Map(counts.map((row) => [row.workId, row._count._all]));
  const enabledByWork = new Map(expansions.map((row) => [row.workId, row.enabled]));
  const games = works
    .map((work) => {
      const criticCount = countByWork.get(work.id) ?? 0;
      return {
        id: work.id,
        title: work.title,
        slug: work.slug,
        criticCount,
        thin: isThin(criticCount),
        enabled: enabledByWork.get(work.id) ?? false,
      };
    })
    .sort((left, right) => Number(right.thin) - Number(left.thin) || left.criticCount - right.criticCount || left.title.localeCompare(right.title));

  return (
    <main className="page shell">
      <p className="kicker">Editor</p>
      <h1>Thin coverage</h1>
      <p className="lede" style={{ margin: "1rem 0 2rem" }}>
        Thin means fewer than {THIN_CRITIC_EVALUATIONS} published critic readings. Detect those games, or check titles yourself, then enable the ones that should be
        expanded. Adding publications reads the critic list for enabled games only and keeps the publication name and site. The review stays on that site.
      </p>
      {tracked.length > 0 ? (
        <section className="panel" style={{ marginBottom: "2rem" }}>
          <h2>Publications from critic lists</h2>
          <ul className="evidence-list">
            {tracked.map((outlet) => (
              <li key={outlet.id}>
                {outlet.name}
                <small>
                  {outlet.host}
                  {outlet.lookup === "sitemap" && outlet.archiveUrl ? " · Archive ready" : " · No readable archive yet"}
                </small>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
      {games.length === 0 ? <p className="empty">No published games yet.</p> : <ThinGameList games={games} />}
    </main>
  );
}
