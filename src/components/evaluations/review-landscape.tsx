"use client";

import type { ReactNode } from "react";
import {
  pairedDimensions,
  pairedSampleNote,
  summaryLines,
  type ReviewLandscape,
  type ShapeMode,
} from "@/lib/aggregation/landscape";
import { completionLabel, lensLabel, standardLabel } from "@/lib/domain/labels";
import { PairedDistribution } from "./distribution-bar";
import { DimensionShape, type Focus } from "./dimension-shape";

const MODES: { value: ShapeMode; label: string }[] = [
  { value: "both", label: "Both" },
  { value: "audience", label: "Audience" },
  { value: "critics", label: "Critics" },
];

export function ReviewLandscapeView({
  critics,
  audience,
  mode,
  onMode,
  focus,
  onFocus,
  totalEvaluations,
  clearHref,
  filteredNote,
  toolbar,
  share,
}: {
  critics: ReviewLandscape;
  audience: ReviewLandscape;
  mode: ShapeMode;
  onMode: (mode: ShapeMode) => void;
  focus: Focus | null;
  onFocus: (population: Focus) => void;
  /** Published evaluations before filters, to tell an empty work from an empty filter. */
  totalEvaluations: number;
  clearHref: string;
  filteredNote?: string;
  toolbar?: ReactNode;
  share?: { title: string; path: string };
}) {
  const showCritics = mode !== "audience";
  const showAudience = mode !== "critics";
  const rows: Focus[] = [];
  if (showCritics && critics.sampleSize > 0) rows.push("critics");
  if (showAudience && audience.sampleSize > 0) rows.push("audience");
  const dimensions = pairedDimensions(critics, audience);
  const { agreement, disagreement } = summaryLines(critics, audience, showCritics, showAudience);
  const note = filteredNote ?? pairedSampleNote(critics, audience);
  const empty = critics.sampleSize === 0 && audience.sampleSize === 0;

  return (
    <section className="section" aria-labelledby="landscape-heading">
      <div className="section-head">
        <div>
          <p className="kicker">From the evidence</p>
          <h2 id="landscape-heading">What these evaluations say</h2>
        </div>
        {totalEvaluations > 0 ? <p>{note}</p> : null}
      </div>
      {totalEvaluations > 0 ? (
        <div className="landscape-toolbar">
          <div className="shape-segment" role="radiogroup" aria-label="Population">
            {MODES.map((item) => {
              const missing =
                (item.value === "critics" && critics.sampleSize === 0) || (item.value === "audience" && audience.sampleSize === 0);
              return (
                <button
                  key={item.value}
                  type="button"
                  role="radio"
                  aria-checked={mode === item.value}
                  disabled={missing}
                  title={missing ? `No ${item.label.toLowerCase()} evaluations in this view` : undefined}
                  onClick={() => onMode(item.value)}
                >
                  {item.label}
                </button>
              );
            })}
          </div>
          {toolbar}
        </div>
      ) : null}
      {empty ? (
        <div className="landscape-empty">
          {totalEvaluations === 0 ? (
            <p>No evaluations currently for this entry.</p>
          ) : (
            <>
              <p>No evaluations match these filters.</p>
              <a className="btn btn-secondary" href={clearHref}>
                Clear filters
              </a>
            </>
          )}
        </div>
      ) : (
        <div className="landscape">
          <DimensionShape critics={critics} audience={audience} rows={rows} focus={focus} onFocus={onFocus} share={share} />
          <div className="split">
            <div className="panel">
              <h3>What reviewers agree on</h3>
              {agreement.length === 0 ? (
                <p className="meta">There isn’t a stable agreement to report from this set.</p>
              ) : (
                <ul className="evidence-list">
                  {agreement.map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
              )}
            </div>
            <div className="panel">
              <h3>Where they disagree</h3>
              {disagreement.length === 0 ? (
                <p className="meta">This set does not show a clear split. That can change as more evaluations arrive.</p>
              ) : (
                <ul className="evidence-list">
                  {disagreement.map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
              )}
            </div>
          </div>
          {dimensions
            .filter(
              (dimension) =>
                (showAudience && dimension.audience.count > 0) || (showCritics && dimension.critics.count > 0),
            )
            .map((dimension) => (
              <PairedDistribution
                key={dimension.slug}
                label={dimension.name}
                critics={dimension.critics}
                audience={dimension.audience}
                showCritics={showCritics}
                showAudience={showAudience}
              />
            ))}
          {showAudience && audience.sampleSize > 0 ? (
            <ApproachSplit
              approachTitle={critics.sampleSize > 0 ? "Audience approach" : "Approach"}
              experienceTitle={critics.sampleSize > 0 ? "How much the audience experienced" : "How much they experienced"}
              landscape={audience}
            />
          ) : null}
          {showCritics && critics.sampleSize > 0 ? (
            <ApproachSplit approachTitle="Critic approach" experienceTitle="How much critics experienced" landscape={critics} />
          ) : null}
        </div>
      )}
    </section>
  );
}

function ApproachSplit({
  approachTitle,
  experienceTitle,
  landscape,
}: {
  approachTitle: string;
  experienceTitle: string;
  landscape: ReviewLandscape;
}) {
  return (
    <div className="split">
      <div>
        <h3>{approachTitle}</h3>
        <ul className="evidence-list">
          {landscape.lenses.map((item) => (
            <li key={item.key}>
              {lensLabel[item.key] ?? item.label} · {item.count}
            </li>
          ))}
          {landscape.standards.map((item) => (
            <li key={item.key}>
              {standardLabel[item.key] ?? item.label} · {item.count}
            </li>
          ))}
        </ul>
      </div>
      <div>
        <h3>{experienceTitle}</h3>
        <ul className="evidence-list">
          {landscape.completions.map((item) => (
            <li key={item.key}>
              {completionLabel[item.key] ?? item.label} · {item.count}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
