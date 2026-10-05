import type { Metadata } from "next";
import { WorkCard } from "@/components/works/work-card";
import { listWorks } from "@/lib/works/queries";

export const metadata: Metadata = {
  title: "Works",
  description: "Games and other works with structured evaluations instead of a single score.",
};

export default async function GamesPage() {
  const works = await listWorks();
  return (
    <main className="page shell">
      <p className="kicker">Catalog</p>
      <h1>Works</h1>
      <p className="lede" style={{ margin: "1rem 0 2rem" }}>
        Each card shows enjoyment and execution separately, with the number of evaluations behind the picture.
      </p>
      <div className="grid-cards">
        {works.map((work) => (
          <WorkCard key={work.id} work={work} />
        ))}
      </div>
    </main>
  );
}
