import { CompareButton } from "@/components/comparison/compare-controls";
import { CriticNestEmblem } from "@/components/evaluations/critic-nest-emblem";
import { ResetSpinButton, SpinClock } from "@/components/evaluations/spin-clock";
import { EmblemDownloads } from "@/components/works/emblem-downloads";
import { GlanceShape } from "@/components/works/glance-shape";
import { ArtImage } from "@/components/works/work-art";
import {
  distributionLabel,
  pairedDimensions,
  pairedEnjoymentDimensions,
  shapePoints,
  type Distribution,
  type ShapePoint,
} from "@/lib/aggregation/landscape";
import { criticsHref, workHref } from "@/lib/domain/labels";
import { landscapesFor, workArt, type CardWork } from "@/lib/works/present";

function closed(points: ShapePoint[]): boolean {
  return points.length >= 3;
}

function reviewNote(count: number): string {
  if (count === 0) return "No published reviews yet";
  if (count === 1) return "Based on 1 review";
  return `Based on ${count} reviews`;
}

function stanceLine(distribution: Distribution): string {
  if (distribution.count === 0) return "No reviews";
  return distributionLabel(distribution);
}

function shapeSummary(label: string, points: ShapePoint[], sample: string): string {
  if (!closed(points)) return `Critics ${label.toLowerCase()}. Not enough dimensions for a shape. ${sample}.`;
  const readings = points.map((point) => `${point.name}, ${distributionLabel(point.distribution)}`).join(". ");
  return `Critics ${label.toLowerCase()}, ${sample}. ${readings}.`;
}

function CriticShape({
  href,
  label,
  points,
  sample,
}: {
  href: string;
  label: string;
  points: ShapePoint[];
  sample: string;
}) {
  const summary = shapeSummary(label, points, sample);
  return (
    <a className="list-six-shape" href={href} aria-label={summary}>
      {closed(points) ? (
        <GlanceShape points={points} summary={summary} labels={false} />
      ) : (
        <div className="list-four-plot">
          <p className="list-four-empty">Not enough dimensions for a shape.</p>
        </div>
      )}
    </a>
  );
}

export function GameListSixPanel({ work }: { work: CardWork }) {
  const art = workArt(work.media);
  const landscapes = landscapesFor(work);
  const critics = landscapes.critics;
  const enjoyment = critics.enjoyment;
  const execution = critics.execution;
  const sample = reviewNote(critics.sampleSize);
  const href = workHref(work.workType, work.slug);
  const breakdown = `${href}#overview`;
  const enjoymentPoints = shapePoints(pairedEnjoymentDimensions(critics, landscapes.audience), "critics");
  const executionPoints = shapePoints(pairedDimensions(critics, landscapes.audience), "critics");
  const coverSrc = art.tall?.src ?? art.wide?.src ?? null;

  return (
    <article className="work-card emblem-panel list-six">
      <SpinClock>
        <a className="list-six-title-link" href={href}>
          <h3 className="list-six-title" title={work.title}>
            {work.title}
          </h3>
        </a>
        <div className="list-six-top">
          <a className="list-six-cover" href={href} aria-label={work.title}>
            <div className="list-six-art">
              <ArtImage art={art} shape="tall" />
              <div className="list-six-badge">
                <CriticNestEmblem compact decorative spin={false} enjoyment={enjoyment} execution={execution} />
              </div>
            </div>
          </a>
          <div className="list-six-take">
            <h4>Critics Take</h4>
            <a href={criticsHref(work.workType, work.slug)}>{sample}</a>
            <div className="list-six-nest">
              <CriticNestEmblem compact spin enjoyment={enjoyment} execution={execution} />
            </div>
          </div>
        </div>
        <dl className="list-six-readings">
          <div>
            <dt>Enjoyment: (inner diamond)</dt>
            <dd>{stanceLine(enjoyment)}</dd>
          </div>
          <div>
            <dt>Execution: outer diamond</dt>
            <dd>{stanceLine(execution)}</dd>
          </div>
        </dl>
        <hr className="list-six-rule" />
        <p className="list-six-cue">Click shapes for in-depth breakdown</p>
        <div className="list-six-shapes">
          <CriticShape href={breakdown} label="Enjoyment" points={enjoymentPoints} sample={sample} />
          <CriticShape href={breakdown} label="Execution" points={executionPoints} sample={sample} />
        </div>
        <div className="work-card-actions">
          <CompareButton workType={work.workType} slug={work.slug} title={work.title} />
          <div className="list-three-tools">
            <ResetSpinButton />
            <EmblemDownloads
              slug={work.slug}
              artSrc={coverSrc}
              mark="nest"
              reading={{
                critics: { enjoyment, execution },
                audience: { enjoyment: landscapes.audience.enjoyment, execution: landscapes.audience.execution },
              }}
            />
          </div>
        </div>
      </SpinClock>
    </article>
  );
}
