"use client";

import { CountTip } from "@/components/evaluations/distribution-bar";
import { ShapeMark } from "@/components/evaluations/shape-mark";
import { distributionLabel, type Distribution } from "@/lib/aggregation/landscape";
import { usePopulationMode } from "@/components/works/population-mode";

function ReadingRow({ label, distribution }: { label: string; distribution: Distribution }) {
  return (
    <div className="paired-track paired-track-dense">
      <ShapeMark distribution={distribution} />
      <span className="track-label">{label}:</span>
      <span className="track-verdict">{distributionLabel(distribution)}</span>
    </div>
  );
}

export function WorkCardGroups({
  critics,
  audience,
}: {
  critics: { enjoyment: Distribution; execution: Distribution };
  audience: { enjoyment: Distribution; execution: Distribution };
}) {
  const mode = usePopulationMode();
  const showCritics = mode !== "audience";
  const showAudience = mode !== "critics";

  return (
    <div className="snapshot">
      {showCritics ? (
        <section className="snapshot-group">
          <h4>Critics</h4>
          <ReadingRow label="Enjoyment" distribution={critics.enjoyment} />
          <ReadingRow label="Execution" distribution={critics.execution} />
        </section>
      ) : null}
      {showAudience ? (
        <section className="snapshot-group">
          <h4>Audience</h4>
          <ReadingRow label="Enjoyment" distribution={audience.enjoyment} />
          <ReadingRow label="Execution" distribution={audience.execution} />
        </section>
      ) : null}
    </div>
  );
}

export function WorkCardCounts({
  criticHref,
  audienceHref,
  criticTip,
  audienceLabel,
}: {
  criticHref: string;
  audienceHref: string;
  criticTip: string;
  audienceLabel: string;
}) {
  const mode = usePopulationMode();
  const showCritics = mode !== "audience";
  const showAudience = mode !== "critics";

  return (
    <p className="card-counts">
      {showCritics ? <CountTip label="Critics" tip={criticTip} href={criticHref} /> : null}
      {showAudience ? <a href={audienceHref}>{audienceLabel}</a> : null}
    </p>
  );
}
