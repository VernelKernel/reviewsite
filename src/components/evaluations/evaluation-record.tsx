import { DimensionReading } from "@/components/evaluations/dimension-reading";
import { EvaluationGraph } from "@/components/evaluations/evaluation-graph";
import { EvaluationNav } from "@/components/evaluations/evaluation-nav";
import { EvaluationShare } from "@/components/evaluations/evaluation-share";
import {
  completionLabel,
  ownershipLabel,
  playtimeLabel,
  reviewHref,
  reviewerHref,
  workHref,
  workTypeLabel,
} from "@/lib/domain/labels";
import type { EvaluationCardInput } from "@/components/evaluations/evaluation-card";
import type { RadarAxis, StanceName } from "@/lib/evaluations/radar";
import { personalHeadline } from "@/lib/intake/judgments";
import { ReviewProse } from "@/components/reviews/review-prose";
import { HeroArt } from "@/components/works/work-art";
import { formatDate, workArt, type FullWork } from "@/lib/works/present";

type Evaluation = FullWork["evaluations"][number];

export function EvaluationRecord({
  work,
  evaluation,
  saved,
}: {
  work: FullWork;
  evaluation: Evaluation;
  saved: boolean;
}) {
  const art = workArt(work.media);
  const path = reviewHref(work.workType, work.slug, evaluation.reviewer.slug);
  const enjoyment = evaluation.enjoyment as StanceName;
  const execution = evaluation.execution as StanceName;
  const judged = evaluation.judgments
    .slice()
    .sort((left, right) => left.dimension.sortOrder - right.dimension.sortOrder || left.dimension.name.localeCompare(right.dimension.name));
  const axes: RadarAxis[] = judged
    .filter((judgment) => judgment.dimension.family !== "ENJOYMENT")
    .map((judgment) => ({ name: judgment.dimension.name, stance: judgment.stance as StanceName, mattered: judgment.mattered }));
  const enjoymentAxes: RadarAxis[] = judged
    .filter((judgment) => judgment.dimension.family === "ENJOYMENT")
    .map((judgment) => ({ name: judgment.dimension.name, stance: judgment.stance as StanceName, mattered: judgment.mattered }));
  const genres = [...work.genres].sort((left, right) => Number(right.isPrimary) - Number(left.isPrimary));
  const glance = glanceItems(evaluation);
  const related = work.evaluations.filter((item) => item.id !== evaluation.id);
  const body = evaluation.review?.body?.trim() ?? "";
  const card: Omit<EvaluationCardInput, "host"> = {
    title: work.title,
    path,
    glance,
    enjoyment,
    execution,
    axes,
  };

  return (
    <main className="page shell evaluation-page">
      {saved ? <p className="form-error">Published. This page is the evaluation.</p> : null}
      <header className="evaluation-hero">
        <HeroArt art={art} className="evaluation-poster" />
        <div className="evaluation-hero-copy">
          <p className="kicker">{workTypeLabel[work.workType]} review</p>
          <h1>
            <a href={workHref(work.workType, work.slug)}>{work.title}</a>
          </h1>
          <p className="evaluation-reviewer">
            <a href={reviewerHref(evaluation.reviewer.slug)}>{evaluation.reviewer.displayName}</a>
          </p>
        </div>
        {genres.length > 0 ? (
          <aside className="impression-card">
            <ul className="impression-genres">
              {genres.map((item) => (
                <li key={item.genre.id}>
                  <a className="chip" href={`/discover?genre=${item.genre.slug}`}>
                    {item.genre.name}
                  </a>
                </li>
              ))}
            </ul>
          </aside>
        ) : null}
      </header>

      <div className="evaluation-board">
        <EvaluationNav />
        <div className="evaluation-main">
          <section id="overview" className="evaluation-overview" aria-label="Overview">
            <EvaluationGraph
              fields={[
                { label: "Execution", stance: execution, axes },
                { label: "Enjoyment", stance: enjoyment, axes: enjoymentAxes },
              ]}
            />
            <div className="evaluation-side">
              <DimensionBreakdown id="execution-breakdown" title="Execution breakdown" axes={axes} />
              <DimensionBreakdown id="enjoyment-breakdown" title="Enjoyment breakdown" axes={enjoymentAxes} />
            </div>
            {glance.length > 0 ? (
              <section className="panel note-card glance-card" aria-labelledby="at-a-glance">
                <h2 id="at-a-glance">At a glance</h2>
                <ul className="glance-list">
                  {glance.map((item) => (
                    <li key={item.label}>
                      <i className="flair-icon" data-icon={item.icon} aria-hidden="true" />
                      <strong>{item.value}</strong>
                      <span>{item.label}</span>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}
          </section>

          <section id="details" className="evaluation-details">
            <h2>Details</h2>
            {evaluation.review?.title ? <h3>{evaluation.review.title}</h3> : null}
            {body ? (
              <ReviewProse
                body={body}
                sections={(evaluation.review?.sections ?? []).map((section) => ({
                  heading: section.dimension?.name ?? null,
                  body: section.body,
                }))}
              />
            ) : (
              <p className="meta">No written review. The stances above are the evaluation.</p>
            )}
            {evaluation.review?.source === "IMPORTED" ? (
              <p className="provenance">
                Imported{evaluation.review.importSourceName ? ` from ${evaluation.review.importSourceName}` : ""}. This text was not originally written on Frame.
                {evaluation.review.importSourceUrl ? (
                  <>
                    {" "}
                    <a href={evaluation.review.importSourceUrl} rel="noreferrer noopener">
                      {evaluation.review.importSourceName === "Steam" ? "View on Steam" : "View source"}
                    </a>
                  </>
                ) : null}
              </p>
            ) : null}
            {evaluation.reviewedOn ? <p className="provenance">{formatDate(evaluation.reviewedOn)}</p> : null}
          </section>

          <section id="related" className="evaluation-related">
            <h2>Related reviews</h2>
            {related.length > 0 ? (
              <ul className="related-list">
                {related.map((item) => (
                  <li key={item.id}>
                    <a href={reviewHref(work.workType, work.slug, item.reviewer.slug)}>{item.reviewer.displayName}</a>
                    <span>{personalHeadline(item.enjoyment, item.execution)}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="meta">No other published evaluations of this work yet.</p>
            )}
          </section>

        </div>
      </div>
      <EvaluationShare card={card} />
    </main>
  );
}

function DimensionBreakdown({ id, title, axes }: { id: string; title: string; axes: RadarAxis[] }) {
  return (
    <section className="panel evaluation-panel" aria-labelledby={id}>
      <h2 id={id}>{title}</h2>
      {axes.length > 0 ? (
        <ul className="dimension-breakdown">
          {axes.map((axis) => (
            <li key={axis.name}>
              <DimensionReading name={axis.name} stance={axis.stance} mattered={axis.mattered} />
            </li>
          ))}
        </ul>
      ) : (
        <p className="meta">No dimensions judged.</p>
      )}
    </section>
  );
}

type GlanceItem = { value: string; label: string; icon: "gamepad" | "clock" | "replay" | "lock" };

function glanceItems(evaluation: Evaluation): GlanceItem[] {
  const items: GlanceItem[] = [];
  if (evaluation.platform) items.push({ value: evaluation.platform.name, label: "Platform", icon: "gamepad" });
  if (evaluation.playtime !== "UNKNOWN") items.push({ value: playtimeLabel[evaluation.playtime], label: "Playtime", icon: "clock" });
  if (evaluation.completion !== "UNKNOWN") items.push({ value: completionLabel[evaluation.completion], label: "Completion", icon: "replay" });
  if (evaluation.ownership) items.push({ value: ownershipLabel[evaluation.ownership], label: "Access", icon: "lock" });
  return items;
}
