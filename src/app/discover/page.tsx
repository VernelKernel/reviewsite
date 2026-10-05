import type { Metadata } from "next";
import { CompareButton } from "@/components/comparison/compare-controls";
import { evidenceShelves } from "@/lib/aggregation/discover";
import { listWorks } from "@/lib/works/queries";
import { landscapeFor } from "@/lib/works/present";

export const metadata: Metadata = {
  title: "Discover",
  description: "Patterns inside a genre: enjoyment against execution, disagreement, and standards.",
};

export default async function DiscoverPage({
  searchParams,
}: {
  searchParams: Promise<{ genre?: string }>;
}) {
  const { genre: genreSlug } = await searchParams;
  const works = await listWorks();
  const genres = [...new Map(works.flatMap((work) => work.genres.map((item) => [item.genre.slug, item.genre.name]))).entries()]
    .map(([slug, name]) => ({ slug, name }))
    .sort((a, b) => a.name.localeCompare(b.name));
  const selected = genres.find((genre) => genre.slug === genreSlug);
  const unknownGenre = Boolean(genreSlug) && !selected;
  const scoped = !genreSlug
    ? works
    : selected
      ? works.filter((work) => work.genres.some((item) => item.genre.slug === selected.slug))
      : [];
  const shelves = evidenceShelves(
    scoped.map((work) => ({
      title: work.title,
      slug: work.slug,
      workType: work.workType,
      landscape: landscapeFor(work),
    })),
  );

  return (
    <main className="page shell">
      <p className="kicker">Discover</p>
      <h1>{selected ? selected.name : "Patterns in a set"}</h1>
      <p className="lede" style={{ margin: "1rem 0 1.5rem" }}>
        {selected
          ? `${selected.name} is the set. A work is listed when its own evaluations meet the threshold for that question.`
          : "Choose a genre to keep the set small. Each work qualifies on its own evaluations. These lists are not a ranking of the catalog."}
      </p>
      <div className="filters" aria-label="Genre">
        <a className="chip" href="/discover" aria-current={!genreSlug ? "true" : undefined}>
          All works
        </a>
        {genres.map((genre) => (
          <a
            key={genre.slug}
            className="chip"
            href={`/discover?genre=${genre.slug}`}
            aria-current={genre.slug === genreSlug ? "true" : undefined}
          >
            {genre.name}
          </a>
        ))}
      </div>
      {unknownGenre ? <p className="empty">That genre is not in the catalog.</p> : null}
      {shelves.map((shelf) => (
        <section className="section" key={shelf.id} aria-labelledby={`shelf-${shelf.id}`}>
          <h2 id={`shelf-${shelf.id}`}>{shelf.title}</h2>
          <p className="meta" style={{ margin: "0.75rem 0 1.25rem" }}>
            {shelf.description}
          </p>
          {shelf.works.length === 0 ? (
            <p className="empty">Nothing in this set meets that threshold yet.</p>
          ) : (
            <ul className="evidence-list">
              {shelf.works.map((work) => (
                <li key={work.href} className="shelf-row">
                  <div>
                    <a href={work.href}>{work.title}</a>
                    <p className="meta">{work.note}</p>
                  </div>
                  <CompareButton workType={work.workType} slug={work.slug} title={work.title} />
                </li>
              ))}
            </ul>
          )}
        </section>
      ))}
    </main>
  );
}
