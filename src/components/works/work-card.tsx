import { cardCountLine } from "@/lib/aggregation/landscape";
import { CompareButton } from "@/components/comparison/compare-controls";
import { PairedDistribution } from "@/components/evaluations/distribution-bar";
import { workHref, workTypeLabel } from "@/lib/domain/labels";
import { creatorLine, landscapesFor, primaryArt, releaseYear, type CardWork } from "@/lib/works/present";

export function WorkCard({ work }: { work: CardWork }) {
  const art = primaryArt(work.media);
  const landscapes = landscapesFor(work);
  const year = releaseYear(work.releases);
  return (
    <article className="work-card">
      <a className="work-card-link" href={workHref(work.workType, work.slug)}>
        <div className="work-card-media">
          {art ? <img src={art.src} alt={art.alt} /> : null}
        </div>
        <div className="work-card-body">
          <p className="meta">
            {workTypeLabel[work.workType]}
            {year ? ` · ${year}` : ""}
            {creatorLine(work.creators) ? ` · ${creatorLine(work.creators)}` : ""}
          </p>
          <h3>{work.title}</h3>
          <div className="snapshot">
            <PairedDistribution
              label="Enjoyment"
              critics={landscapes.critics.enjoyment}
              audience={landscapes.audience.enjoyment}
              dense
            />
            <PairedDistribution
              label="Execution"
              critics={landscapes.critics.execution}
              audience={landscapes.audience.execution}
              dense
            />
          </div>
          <p className="meta">{cardCountLine(landscapes.critics.sampleSize, landscapes.audience.sampleSize)}</p>
        </div>
      </a>
      <div className="work-card-actions">
        <CompareButton workType={work.workType} slug={work.slug} title={work.title} />
      </div>
    </article>
  );
}
