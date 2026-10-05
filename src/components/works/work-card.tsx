import {
  distributionLabel,
  dominantKey,
  percentages,
  type Distribution,
} from "@/lib/aggregation/landscape";
import { CompareButton } from "@/components/comparison/compare-controls";
import { workHref, workTypeLabel } from "@/lib/domain/labels";
import { creatorLine, landscapeFor, primaryArt, releaseYear, type CardWork } from "@/lib/works/present";

function verdictClass(distribution: Distribution): string {
  const dominant = dominantKey(distribution);
  if (dominant) return `stance stance-${dominant}`;
  return distribution.count === 0 ? "snapshot-quiet" : "snapshot-divided";
}

function SnapshotSignal({ label, distribution }: { label: string; distribution: Distribution }) {
  const pct = percentages(distribution);
  const verdict = distributionLabel(distribution);
  const mix =
    distribution.count === 0
      ? verdict
      : `${verdict}. Positive ${pct.positive}%, mixed ${pct.mixed}%, negative ${pct.negative}%`;

  return (
    <div className="snapshot-signal">
      <div className="snapshot-head">
        <span className="snapshot-label">{label}</span>
        <span className={verdictClass(distribution)}>{verdict}</span>
      </div>
      <div className="dist-bar" role="img" aria-label={`${label}: ${mix}`}>
        {distribution.count > 0 ? (
          <>
            <span className="dist-positive" style={{ width: `${pct.positive}%` }} />
            <span className="dist-mixed" style={{ width: `${pct.mixed}%` }} />
            <span className="dist-negative" style={{ width: `${pct.negative}%` }} />
          </>
        ) : null}
      </div>
    </div>
  );
}

export function WorkCard({ work }: { work: CardWork }) {
  const art = primaryArt(work.media);
  const landscape = landscapeFor(work);
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
            <SnapshotSignal label="Enjoyment" distribution={landscape.enjoyment} />
            <SnapshotSignal label="Execution" distribution={landscape.execution} />
          </div>
          <p className="meta">{landscape.sampleNote}</p>
        </div>
      </a>
      <div className="work-card-actions">
        <CompareButton workType={work.workType} slug={work.slug} title={work.title} />
      </div>
    </article>
  );
}
