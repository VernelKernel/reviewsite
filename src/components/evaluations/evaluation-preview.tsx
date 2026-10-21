"use client";

import { useFormStatus } from "react-dom";
import { DimensionReading } from "@/components/evaluations/dimension-reading";
import { EvaluationGraph } from "@/components/evaluations/evaluation-graph";
import { ArtImage } from "@/components/works/work-art";
import { completionLabel, ownershipLabel, playtimeLabel, stanceClass, stanceLabel } from "@/lib/domain/labels";
import { personalHeadline } from "@/lib/intake/judgments";
import type { RadarAxis, StanceName } from "@/lib/evaluations/radar";
import type { WorkArt } from "@/lib/works/present";

type GlanceItem = { value: string; label: string; icon: "gamepad" | "clock" | "replay" | "lock" };

export function EvaluationPreview({
  title,
  art,
  genres,
  platformName,
  playtime,
  completion,
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
  ownership: string;
  enjoyment: string;
  execution: string;
  workAxes: RadarAxis[];
  enjoymentAxes: RadarAxis[];
  publishLabel: string;
}) {
  const headline = isStance(enjoyment) && isStance(execution) ? personalHeadline(enjoyment, execution) : null;
  const byline = [
    platformName,
    ...genres.slice(0, 2).map((genre) => genre.name),
    playtime && playtime !== "UNKNOWN" ? playtimeLabel[playtime] : "",
  ].filter(Boolean);
  const glance = glanceItems({ platformName, playtime, completion, ownership });

  return (
    <aside className="builder-preview" id="preview" aria-label="Live preview">
      <div className="panel builder-preview-scroll">
        <div className="builder-work">
          <ArtImage art={art} shape="tall" className="builder-poster" decorative />
          <div>
            <p className="builder-work-title">{title}</p>
            {headline ? <p className="lede">{headline}</p> : null}
            {byline.length > 0 ? (
              <p className="evaluation-byline">
                {byline.map((item) => (
                  <span key={item}>{item}</span>
                ))}
              </p>
            ) : null}
          </div>
        </div>
        <EvaluationGraph
          fields={[
            { label: "Execution", stance: isStance(execution) ? execution : null, axes: workAxes },
            { label: "Enjoyment", stance: isStance(enjoyment) ? enjoyment : null, axes: enjoymentAxes },
          ]}
        />
        <section className="evaluation-panel" aria-labelledby="builder-key-impressions">
          <h2 id="builder-key-impressions">Key impressions</h2>
          <div className="preview-group">
            {isStance(enjoyment) ? <StanceMeter label="Enjoyment" stance={enjoyment} /> : <p className="meta">Enjoyment not selected</p>}
            {enjoymentAxes.length > 0 ? (
              <ul className="dimension-breakdown">
                {enjoymentAxes.map((axis) => (
                  <BreakdownRow key={axis.name} axis={axis} />
                ))}
              </ul>
            ) : null}
          </div>
          <div className="preview-group">
            {isStance(execution) ? <StanceMeter label="Execution" stance={execution} /> : <p className="meta">Execution not selected</p>}
            {workAxes.length > 0 ? (
              <ul className="dimension-breakdown">
                {workAxes.map((axis) => (
                  <BreakdownRow key={axis.name} axis={axis} />
                ))}
              </ul>
            ) : null}
          </div>
        </section>
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
      <DimensionReading name={axis.name} stance={axis.stance} mattered={axis.mattered} />
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
    </div>
  );
}

function glanceItems({
  platformName,
  playtime,
  completion,
  ownership,
}: {
  platformName: string;
  playtime: string;
  completion: string;
  ownership: string;
}): GlanceItem[] {
  const items: GlanceItem[] = [];
  if (platformName) items.push({ value: platformName, label: "Platform", icon: "gamepad" });
  if (playtime && playtime !== "UNKNOWN") items.push({ value: playtimeLabel[playtime] ?? playtime, label: "Playtime", icon: "clock" });
  if (completion && completion !== "UNKNOWN") items.push({ value: completionLabel[completion] ?? completion, label: "Completion", icon: "replay" });
  if (ownership) items.push({ value: ownershipLabel[ownership] ?? ownership, label: "Access", icon: "lock" });
  return items;
}

export function isStance(value: string): value is StanceName {
  return value === "POSITIVE" || value === "MIXED" || value === "NEGATIVE";
}

export function IntentButton({ intent, children }: { intent: "draft" | "publish"; children: string }) {
  const { pending, data } = useFormStatus();
  const active = pending && data?.get("intent") === intent;
  const label = active ? (intent === "draft" ? "Saving draft…" : "Saving review…") : children;
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
