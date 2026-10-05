import type { Metadata } from "next";
import { GapCallouts } from "@/components/comparison/gap-callouts";
import { DistributionBar } from "@/components/evaluations/distribution-bar";
import { CompareRemove, CompareSync } from "@/components/comparison/compare-controls";
import { compareKey, parseCompareKeys, type CompareRef } from "@/lib/comparison/selection";
import { workHref } from "@/lib/domain/labels";
import { listWorks } from "@/lib/works/queries";
import { landscapeFor, primaryArt } from "@/lib/works/present";

export const metadata: Metadata = {
  title: "Compare",
  description: "Compare enjoyment and execution across a few works.",
};

export default async function ComparePage({
  searchParams,
}: {
  searchParams: Promise<{ works?: string }>;
}) {
  const { works: raw } = await searchParams;
  const keys = parseCompareKeys(raw);
  const catalog = await listWorks();
  const selected = keys
    .map((key) => catalog.find((work) => work.workType === key.workType && work.slug === key.slug))
    .filter((work): work is (typeof catalog)[number] => Boolean(work));
  const refs: CompareRef[] = selected.map((work) => ({
    workType: work.workType,
    slug: work.slug,
    title: work.title,
  }));

  return (
    <main className="page shell">
      <CompareSync items={refs} />
      <p className="kicker">Comparison</p>
      <h1>A few works, side by side</h1>
      <p className="lede" style={{ margin: "1rem 0 2rem" }}>
        Four is the limit. Each column is that work’s own evaluations: enjoyment, execution, and the sample behind them.
      </p>
      {selected.length < 2 ? (
        <p className="empty">
          {selected.length === 0
            ? "Add two to four works from their pages or cards, then open the comparison."
            : `${selected[0]?.title ?? "One work"} is in the set. Add at least one more.`}
        </p>
      ) : (
        <div className="compare-grid">
          {selected.map((work) => {
            const landscape = landscapeFor(work);
            const art = primaryArt(work.media);
            const standards = landscape.disagreement.find((line) => line.includes("expectations"));
            return (
              <section className="compare-column" key={compareKey(work)} aria-labelledby={`compare-${work.slug}`}>
                <a className="compare-art" href={workHref(work.workType, work.slug)}>
                  {art ? <img src={art.src} alt={art.alt} /> : null}
                </a>
                <div className="compare-column-body">
                  <h2 id={`compare-${work.slug}`}>
                    <a href={workHref(work.workType, work.slug)}>{work.title}</a>
                  </h2>
                  <DistributionBar label="Enjoyment" distribution={landscape.enjoyment} />
                  <DistributionBar label="Execution" distribution={landscape.execution} />
                  <p className="sample-note">{landscape.sampleNote}</p>
                  <GapCallouts landscape={landscape} />
                  {standards ? <p>{standards}</p> : null}
                  <CompareRemove itemKey={compareKey(work)} title={work.title} />
                </div>
              </section>
            );
          })}
        </div>
      )}
    </main>
  );
}
