import type { Metadata } from "next";
import { WorkCard } from "@/components/works/work-card";
import { searchWorks } from "@/lib/works/queries";

export const metadata: Metadata = {
  title: "Search",
  description: "Search works, creators, and the text of published evaluations.",
};

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = "" } = await searchParams;
  const query = q.trim();
  const results = query.length >= 2 ? await searchWorks(query) : [];

  return (
    <main className="page shell">
      <p className="kicker">Search</p>
      <h1>Find a work or a criticism</h1>
      <form className="search-form" action="/search" method="get" role="search" style={{ margin: "1.5rem 0 2rem" }}>
        <label className="field" style={{ minWidth: "16rem" }}>
          <span className="sr-only">Search</span>
          <input name="q" type="search" defaultValue={query} placeholder="Title, creator, topic, or phrase" />
        </label>
        <button className="btn btn-primary" type="submit">
          Search
        </button>
      </form>
      {query.length < 2 ? (
        <p className="meta">Enter at least two characters. Search looks through titles, creators, genres, and published review text.</p>
      ) : results.length === 0 ? (
        <p className="empty">Nothing in the catalog matches “{query}”.</p>
      ) : (
        <div className="grid-cards">
          {results.map((work) => (
            <WorkCard key={work.id} work={work} />
          ))}
        </div>
      )}
    </main>
  );
}
