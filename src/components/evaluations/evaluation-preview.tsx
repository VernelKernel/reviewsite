"use client";

import { useFormStatus } from "react-dom";
import { EvaluationGraph } from "@/components/evaluations/evaluation-graph";
import { ArtImage } from "@/components/works/work-art";
import {
  completionLabel,
  lensLabel,
  ownershipLabel,
  playtimeLabel,
  stanceClass,
  stanceLabel,
} from "@/lib/domain/labels";
import { personalHeadline } from "@/lib/intake/judgments";
import type { RadarAxis, StanceName } from "@/lib/evaluations/radar";
import type { WorkArt } from "@/lib/works/present";

type GlanceItem = { value: string; label: string; icon: "gamepad" | "clock" | "replay" | "star" | "lock" };

export function EvaluationPreview({
  title,
  art,
  genres,
  platformName,
  playtime,
  completion,
  lens,
  ownership,
  enjoyment,
  execution,
  workAxes,
  enjoymentAxes,
  publishLabel,
}: {
  title: string;
  art: WorkArt;
  genres: { name: string; slug: string }[];
  platformName: string;
  playtime: string;
  completion: string;
  lens: string;
  ownership: string;
  enjoyment: string;
  execution: string;
  workAxes: RadarAxis[];
  enjoymentAxes: RadarAxis[];
  publishLabel: string;
}) {
  const headline =
    isStance(enjoyment) && isStance(execution) ? personalHeadline(enjoyment, execution) : "Your evaluation updates as you answer.";
  const byline = [
    platformName,
    ...genres.slice(0, 2).map((genre) => genre.name),
    playtime && playtime !== "UNKNOWN" ? playtimeLabel[playtime] : "",
  ].filter(Boolean);
  const glance = glanceItems({ platformName, playtime, completion, lens, ownership });

  return (
    <aside className="builder-preview" id="preview" aria-label="Live preview">
      <div className="panel builder-preview-scroll">
        <header className="builder-preview-head">
          <p className="kicker">Live preview</p>
          <p className="meta">Your evaluation updates as you answer.</p>
        </header>
        <div className="builder-work">
          <ArtImage art={art} shape="tall" className="builder-poster" decorative />
          <div>
            <p className="builder-work-title">{title}</p>
            <p className="lede">{headline}</p>
            {byline.length > 0 ? (
              <p className="evaluation-byline">
                {byline.map((item) => (
                  <span key={item}>{item}</span>
                ))}
              </p>
            ) : null}
          </div>
        </div>
        <EvaluationGraph axes={workAxes} />
        <section className="evaluation-panel" aria-labelledby="builder-key-impressions">
          <h2 id="builder-key-impressions">Key impressions</h2>
          {isStance(enjoyment) ? <StanceMeter label="Enjoyment" stance={enjoyment} /> : <p className="meta">Enjoyment is not judged yet.</p>}
          {enjoymentAxes.length > 0 ? (
            <ul className="dimension-breakdown" aria-label="Enjoyment dimensions">
              {enjoymentAxes.map((axis) => (
                <BreakdownRow key={axis.name} axis={axis} />
              ))}
            </ul>
          ) : null}
          {isStance(execution) ? <StanceMeter label="Execution" stance={execution} /> : <p className="meta">Execution is not judged yet.</p>}
        </section>
        {workAxes.length > 0 ? (
          <section className="evaluation-panel" aria-labelledby="builder-dimension-breakdown">
            <h2 id="builder-dimension-breakdown">Dimension breakdown</h2>
            <ul className="dimension-breakdown">
              {workAxes.map((axis) => (
                <BreakdownRow key={axis.name} axis={axis} />
              ))}
            </ul>
          </section>
        ) : null}
        {glance.length > 0 ? (
          <section className="evaluation-panel" aria-labelledby="builder-glance">
            <h2 id="builder-glance">At a glance</h2>
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
        <p className="builder-preview-note">
          A visual record of your experience. Publishing turns this into a shareable page with the chart, key impressions, and your notes.
        </p>
        <div className="builder-publish">
          <IntentButton intent="publish">{publishLabel}</IntentButton>
        </div>
      </div>
    </aside>
  );
}

function BreakdownRow({ axis }: { axis: RadarAxis }) {
  return (
    <li>
      <i className={`dimension-dot dimension-dot-${axis.stance.toLowerCase()}`} aria-hidden="true" />
      <span>{axis.name}</span>
      <span className={stanceClass(axis.stance)}>{stanceLabel[axis.stance]}</span>
    </li>
  );
}

function StanceMeter({ label, stance }: { label: string; stance: StanceName }) {
  const icon = label === "Enjoyment" ? "heart" : "gear";
  return (
    <div className="stance-meter">
      <div className="stance-meter-head">
        <strong>
          <i className="flair-icon" data-icon={icon} aria-hidden="true" />
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

function glanceItems({
  platformName,
  playtime,
  completion,
  lens,
  ownership,
}: {
  platformName: string;
  playtime: string;
  completion: string;
  lens: string;
  ownership: string;
}): GlanceItem[] {
  const items: GlanceItem[] = [];
  if (platformName) items.push({ value: platformName, label: "Platform", icon: "gamepad" });
  if (playtime && playtime !== "UNKNOWN") items.push({ value: playtimeLabel[playtime] ?? playtime, label: "Playtime", icon: "clock" });
  if (completion && completion !== "UNKNOWN") items.push({ value: completionLabel[completion] ?? completion, label: "Completion", icon: "replay" });
  if (lens) items.push({ value: lensLabel[lens] ?? lens, label: "Lens", icon: "star" });
  if (ownership) items.push({ value: ownershipLabel[ownership] ?? ownership, label: "Access", icon: "lock" });
  return items;
}

export function isStance(value: string): value is StanceName {
  return value === "POSITIVE" || value === "MIXED" || value === "NEGATIVE";
}

export function IntentButton({ intent, children }: { intent: "draft" | "publish"; children: string }) {
  const { pending, data } = useFormStatus();
  const active = pending && data?.get("intent") === intent;
  const label = active ? (intent === "draft" ? "Saving draft…" : "Saving evaluation…") : children;
  return (
    <button
      className={intent === "publish" ? "btn btn-primary" : "btn btn-secondary"}
      type="submit"
      name="intent"
      value={intent}
      disabled={pending}
      aria-busy={active}
    >
      {label}
    </button>
  );
}
