import { EvaluationGraph } from "@/components/evaluations/evaluation-graph";
import { EvaluationNav } from "@/components/evaluations/evaluation-nav";
import { EvaluationShare } from "@/components/evaluations/evaluation-share";
import {
  completionLabel,
  lensLabel,
  ownershipLabel,
  playtimeLabel,
  reviewHref,
  reviewerHref,
  stanceClass,
  stanceLabel,
  workHref,
  workTypeLabel,
} from "@/lib/domain/labels";
import type { EvaluationCardInput } from "@/components/evaluations/evaluation-card";
import type { RadarAxis, StanceName } from "@/lib/evaluations/radar";
import { personalHeadline } from "@/lib/intake/judgments";
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
  const axes: RadarAxis[] = evaluation.judgments
    .slice()
    .sort((left, right) => left.dimension.sortOrder - right.dimension.sortOrder || left.dimension.name.localeCompare(right.dimension.name))
    .map((judgment) => ({ name: judgment.dimension.name, stance: judgment.stance as StanceName }));
  const strengths = evaluation.observations.filter((item) => item.polarity === "PRAISE").map((item) => item.content);
  const weaknesses = evaluation.observations.filter((item) => item.polarity === "CRITICISM").map((item) => item.content);
  const genres = [...work.genres].sort((left, right) => Number(right.isPrimary) - Number(left.isPrimary));
  const impression = evaluation.review?.impression?.trim() || null;
  const headline = personalHeadline(enjoyment, execution);
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
    strengths,
    weaknesses,
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
          <p className="lede">{headline}</p>
          <p className="evaluation-byline">
            <a href={reviewerHref(evaluation.reviewer.slug)}>{evaluation.reviewer.displayName}</a>
            {evaluation.platform ? <span>{evaluation.platform.name}</span> : null}
            {evaluation.playtime !== "UNKNOWN" ? <span>{playtimeLabel[evaluation.playtime]}</span> : null}
          </p>
        </div>
        {impression || genres.length > 0 ? (
          <aside className="impression-card">
            {impression ? <p className="impression-line">{impression}</p> : null}
            {genres.length > 0 ? (
              <ul className="impression-genres">
                {genres.map((item) => (
                  <li key={item.genre.id}>
                    <a className="chip" href={`/discover?genre=${item.genre.slug}`}>
                      {item.genre.name}
                    </a>
                  </li>
                ))}
              </ul>
            ) : null}
          </aside>
        ) : null}
      </header>

      <div className="evaluation-board">
        <EvaluationNav />
        <div className="evaluation-main">
          <section id="overview" className="evaluation-overview" aria-label="Overview">
            <EvaluationGraph axes={axes} />
            <div className="evaluation-side">
              <section className="panel evaluation-panel" aria-labelledby="key-impressions">
                <h2 id="key-impressions">Key impressions</h2>
                <StanceMeter label="Enjoyment" stance={enjoyment} />
                <StanceMeter label="Execution" stance={execution} />
              </section>
              {axes.length > 0 ? (
                <section className="panel evaluation-panel" aria-labelledby="dimension-breakdown">
                  <h2 id="dimension-breakdown">Dimension breakdown</h2>
                  <ul className="dimension-breakdown">
                    {axes.map((axis) => (
                      <li key={axis.name}>
                        <i className={`dimension-dot dimension-dot-${axis.stance.toLowerCase()}`} aria-hidden="true" />
                        <span>{axis.name}</span>
                        <span className={stanceClass(axis.stance)}>{stanceLabel[axis.stance]}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null}
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

          {strengths.length > 0 || weaknesses.length > 0 ? (
            <div className="evaluation-cards">
              {strengths.length > 0 ? (
                <section className="note-card note-card-praise" aria-labelledby="strengths">
                  <h2 id="strengths">
                    <i className="flair-icon" data-icon="beacon" aria-hidden="true" />
                    Strengths
                  </h2>
                  <ul>
                    {strengths.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </section>
              ) : null}
              {weaknesses.length > 0 ? (
                <section className="note-card note-card-criticism" aria-labelledby="weaknesses">
                  <h2 id="weaknesses">
                    <i className="flair-icon" data-icon="warning" aria-hidden="true" />
                    Weaknesses
                  </h2>
                  <ul>
                    {weaknesses.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </section>
              ) : null}
            </div>
          ) : null}

          <section id="details" className="evaluation-details">
            <h2>Details</h2>
            {evaluation.standardNote ? <p>{evaluation.standardNote}</p> : null}
            {evaluation.review?.title ? <h3>{evaluation.review.title}</h3> : null}
            {body ? (
              <div className="prose">
                {body.split(/\n{2,}/).map((paragraph) => (
                  <p key={paragraph.slice(0, 48)}>{paragraph}</p>
                ))}
              </div>
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

function StanceMeter({ label, stance }: { label: string; stance: StanceName }) {
  const icon = label === "Enjoyment" ? "heart" : label === "Execution" ? "gear" : null;
  return (
    <div className="stance-meter">
      <div className="stance-meter-head">
        <strong>
          {icon ? <i className="flair-icon" data-icon={icon} aria-hidden="true" /> : null}
          {label}
        </strong>
        <span className={stanceClass(stance)}>{stanceLabel[stance]}</span>
      </div>
      <div className="stance-meter-track" role="img" aria-label={`${label}: ${stanceLabel[stance]}`}>
        <span className={`stance-meter-fill stance-meter-${stance.toLowerCase()}`} />
      </div>
    </div>
  );
}

type GlanceItem = { value: string; label: string; icon: "gamepad" | "clock" | "replay" | "star" | "lock" };

function glanceItems(evaluation: Evaluation): GlanceItem[] {
  const items: GlanceItem[] = [];
  if (evaluation.platform) items.push({ value: evaluation.platform.name, label: "Platform", icon: "gamepad" });
  if (evaluation.playtime !== "UNKNOWN") items.push({ value: playtimeLabel[evaluation.playtime], label: "Playtime", icon: "clock" });
  if (evaluation.completion !== "UNKNOWN") items.push({ value: completionLabel[evaluation.completion], label: "Completion", icon: "replay" });
  if (evaluation.lens) items.push({ value: lensLabel[evaluation.lens], label: "Lens", icon: "star" });
  if (evaluation.ownership) items.push({ value: ownershipLabel[evaluation.ownership], label: "Access", icon: "lock" });
  return items;
}
