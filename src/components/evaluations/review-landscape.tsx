"use client";

import type { ReactNode } from "react";
import { type ReviewLandscape, type ShapeMode } from "@/lib/aggregation/landscape";
import { completionLabel } from "@/lib/domain/labels";
import { DimensionShape, type Focus } from "./dimension-shape";
import { PopulationSegment } from "./population-segment";

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
  const empty = critics.sampleSize === 0 && audience.sampleSize === 0;

  return (
    <section id="overview" className="landscape-section" aria-labelledby="landscape-heading">
      <h2 id="landscape-heading" className="sr-only">
        What these evaluations say
      </h2>
      {totalEvaluations > 0 ? (
        <div className="landscape-toolbar">
          <PopulationSegment
            mode={mode}
            onMode={onMode}
            criticsAvailable={critics.sampleSize > 0}
            audienceAvailable={audience.sampleSize > 0}
          />
          {toolbar}
        </div>
      ) : null}
      {filteredNote ? <p className="landscape-note">{filteredNote}</p> : null}
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
          {showAudience && audience.sampleSize > 0 ? (
            <ExperienceList
              title={critics.sampleSize > 0 ? "How much the audience experienced" : "How much they experienced"}
              landscape={audience}
            />
          ) : null}
          {showCritics && critics.sampleSize > 0 ? <ExperienceList title="How much critics experienced" landscape={critics} /> : null}
        </div>
      )}
    </section>
  );
}

function ExperienceList({ title, landscape }: { title: string; landscape: ReviewLandscape }) {
  return (
    <div className="reading-measure">
      <h3>{title}</h3>
      <ul className="evidence-list">
        {landscape.completions.map((item) => (
          <li key={item.key}>
            {completionLabel[item.key] ?? item.label} · {item.count}
          </li>
        ))}
      </ul>
    </div>
  );
}
