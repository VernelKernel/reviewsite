import { criticCoverage, distributionLabel, type Distribution } from "@/lib/aggregation/landscape";
import { CompareButton } from "@/components/comparison/compare-controls";
import { ReviewEmblem } from "@/components/evaluations/review-emblem";
import { ArtImage } from "@/components/works/work-art";
import { audienceHref, criticsHref, workHref, workTypeLabel } from "@/lib/domain/labels";
import { landscapesFor, releaseYear, workArt, type CardWork } from "@/lib/works/present";

function makerName(creators: CardWork["creators"]): string | null {
  const developer = creators.find((entry) => entry.role === "DEVELOPER");
  const publisher = creators.find((entry) => entry.role === "PUBLISHER");
  return developer?.creator.name ?? publisher?.creator.name ?? null;
}

function ReadingPair({ enjoyment, execution }: { enjoyment: Distribution; execution: Distribution }) {
  return (
    <dl className="emblem-reading">
      <dt>Enjoyment:</dt>
      <dd>{distributionLabel(enjoyment)}</dd>
      <dt>Execution:</dt>
      <dd>{distributionLabel(execution)}</dd>
    </dl>
  );
}

export function EmblemPanel({ work }: { work: CardWork }) {
  const art = workArt(work.media);
  const landscapes = landscapesFor(work);
  const year = releaseYear(work.releases);
  const maker = makerName(work.creators);
  const meta = [workTypeLabel[work.workType] ?? "Work", year ? String(year) : null, maker]
    .filter((part): part is string => Boolean(part))
    .join(" · ");
  const critics = { enjoyment: landscapes.critics.enjoyment, execution: landscapes.critics.execution };
  const audience = { enjoyment: landscapes.audience.enjoyment, execution: landscapes.audience.execution };

  return (
    <article className="work-card emblem-panel">
      <a className="work-card-link" href={workHref(work.workType, work.slug)}>
        <div className="work-card-media">
          <ArtImage art={art} shape="wide" />
        </div>
        <div className="work-card-body">
          <div className="emblem-panel-identity">
            <p className="meta">{meta}</p>
            <h3>{work.title}</h3>
          </div>
          <div className="emblem-panel-mark">
            <ReviewEmblem compact decorative spin critics={critics} audience={audience} />
          </div>
          <div className="snapshot">
            <section className="snapshot-group">
              <h4>Critics</h4>
              <ReadingPair enjoyment={critics.enjoyment} execution={critics.execution} />
            </section>
            <section className="snapshot-group">
              <h4>Audience</h4>
              <ReadingPair enjoyment={audience.enjoyment} execution={audience.execution} />
            </section>
          </div>
        </div>
      </a>
      <p className="card-counts">
        <a href={criticsHref(work.workType, work.slug)}>{`Based on ${criticCoverage(landscapes.critics.coverageCount)}`}</a>
        <a href={audienceHref(work.workType, work.slug)}>{landscapes.audience.sampleNote.replace(/\.$/, "")}</a>
      </p>
      <div className="work-card-actions">
        <CompareButton workType={work.workType} slug={work.slug} title={work.title} />
      </div>
    </article>
  );
}
