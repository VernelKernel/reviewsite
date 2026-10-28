import { CountTip, DistributionFill } from "@/components/evaluations/distribution-bar";
import { CompareButton } from "@/components/comparison/compare-controls";
import { CriticNestEmblem } from "@/components/evaluations/critic-nest-emblem";
import { GlanceShape } from "@/components/works/glance-shape";
import { ArtImage } from "@/components/works/work-art";
import {
  criticCoverage,
  distributionLabel,
  pairedDimensions,
  pairedEnjoymentDimensions,
  percentages,
  shapePoints,
  type Distribution,
  type ReviewLandscape,
  type ShapePoint,
} from "@/lib/aggregation/landscape";
import { audienceHref, criticsHref, workHref } from "@/lib/domain/labels";
import { landscapesFor, workArt, type CardWork } from "@/lib/works/present";

function closed(points: ShapePoint[]): boolean {
  return points.length >= 3;
}

function shapeSummary(population: string, label: string, points: ShapePoint[], sample: string): string {
  if (!closed(points)) return `${population} ${label.toLowerCase()}. Not enough dimensions for a shape. ${sample}.`;
  const readings = points.map((point) => `${point.name}, ${distributionLabel(point.distribution)}`).join(". ");
  return `${population} ${label.toLowerCase()}, ${sample}. ${readings}.`;
}

function GlanceChart({
  label,
  icon,
  points,
  distribution,
  summary,
}: {
  label: string;
  icon: "heart" | "gear";
  points: ShapePoint[];
  distribution: Distribution;
  summary: string;
}) {
  const drawable = closed(points);
  const reading = distributionLabel(distribution);
  return (
    <div className="list-four-chart">
      <div className={`list-four-rail${icon === "gear" ? " list-four-rail-execution" : ""}`}>
        <div className="list-four-mark">
          {icon === "gear" ? <i className="flair-icon" data-icon={icon} aria-hidden="true" /> : null}
          <p className="list-four-axis">{label}</p>
          {icon === "heart" ? <i className="flair-icon" data-icon={icon} aria-hidden="true" /> : null}
        </div>
        <div className="list-four-scale-slot">
          <div className="dist-bar list-four-scale" role="img" aria-label={`${label}: ${reading}.`}>
            {distribution.count > 0 ? <DistributionFill share={percentages(distribution)} /> : null}
          </div>
        </div>
      </div>
      {drawable ? (
        <GlanceShape points={points} summary={summary} />
      ) : (
        <div className="list-four-plot">
          <p className="list-four-empty">Not enough dimensions for a shape.</p>
        </div>
      )}
    </div>
  );
}

function glance(critics: ReviewLandscape, audience: ReviewLandscape) {
  const work = pairedDimensions(critics, audience);
  const enjoyment = pairedEnjoymentDimensions(critics, audience);
  const criticPoints = {
    enjoyment: shapePoints(enjoyment, "critics"),
    execution: shapePoints(work, "critics"),
  };
  const audiencePoints = {
    enjoyment: shapePoints(enjoyment, "audience"),
    execution: shapePoints(work, "audience"),
  };
  const ready = (points: { enjoyment: ShapePoint[]; execution: ShapePoint[] }) =>
    closed(points.enjoyment) || closed(points.execution);
  if (ready(criticPoints) || !ready(audiencePoints)) {
    return {
      name: "Critics",
      sample: criticCoverage(critics.coverageCount),
      points: criticPoints,
      enjoyment: critics.enjoyment,
      execution: critics.execution,
    };
  }
  return {
    name: "Audience",
    sample: audience.sampleNote.replace(/\.$/, ""),
    points: audiencePoints,
    enjoyment: audience.enjoyment,
    execution: audience.execution,
  };
}

export function GameListFourPanel({ work }: { work: CardWork }) {
  const art = workArt(work.media);
  const landscapes = landscapesFor(work);
  const view = glance(landscapes.critics, landscapes.audience);

  return (
    <article className="work-card emblem-panel list-four">
      <a className="work-card-link" href={workHref(work.workType, work.slug)}>
        <h3 className="list-four-title">{work.title}</h3>
        <div className="list-four-body">
          <div className="list-four-art">
            <ArtImage art={art} shape="tall" />
            <div className="list-four-badge">
              <CriticNestEmblem
                compact
                decorative
                spin={false}
                enjoyment={landscapes.critics.enjoyment}
                execution={landscapes.critics.execution}
              />
            </div>
          </div>
          <div className="list-four-charts">
            <GlanceChart
              label="Enjoyment"
              icon="heart"
              points={view.points.enjoyment}
              distribution={view.enjoyment}
              summary={shapeSummary(view.name, "Enjoyment", view.points.enjoyment, view.sample)}
            />
            <GlanceChart
              label="Execution"
              icon="gear"
              points={view.points.execution}
              distribution={view.execution}
              summary={shapeSummary(view.name, "Execution", view.points.execution, view.sample)}
            />
          </div>
        </div>
      </a>
      <p className="card-counts">
        <CountTip label="Critics" tip={criticCoverage(landscapes.critics.coverageCount)} href={criticsHref(work.workType, work.slug)} />
        <a href={audienceHref(work.workType, work.slug)}>{landscapes.audience.sampleNote.replace(/\.$/, "")}</a>
      </p>
      <div className="work-card-actions">
        <CompareButton workType={work.workType} slug={work.slug} title={work.title} />
      </div>
    </article>
  );
}
