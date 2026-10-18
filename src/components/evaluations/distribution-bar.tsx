import type { CSSProperties } from "react";
import { distributionLabel, percentages, type Distribution } from "@/lib/aggregation/landscape";
import { ShapeMark } from "@/components/evaluations/shape-mark";

const BLEND = 5;

type Share = { positive: number; mixed: number; negative: number };

/** Soft join only where two stance colors actually meet, so a single reading stays flat. */
export function distributionGradient(share: Share): string {
  const segments = [
    { width: share.positive, color: "var(--color-positive)" },
    { width: share.mixed, color: "var(--color-caution)" },
    { width: share.negative, color: "var(--color-negative)" },
  ].filter((segment) => segment.width > 0);

  if (segments.length === 0) return "transparent";
  if (segments.length === 1) return segments[0].color;

  const stops: string[] = [];
  let cursor = 0;
  for (let index = 0; index < segments.length; index += 1) {
    const segment = segments[index];
    const start = cursor;
    const end = cursor + segment.width;
    const blendBefore = index === 0 ? 0 : blendWidth(segments[index - 1].width, segment.width);
    const blendAfter = index === segments.length - 1 ? 0 : blendWidth(segment.width, segments[index + 1].width);
    const solidStart = start + blendBefore;
    const solidEnd = end - blendAfter;
    if (index === 0) stops.push(`${segment.color} 0%`);
    else stops.push(`${segment.color} ${formatStop(solidStart)}%`);
    if (index === segments.length - 1) stops.push(`${segment.color} 100%`);
    else if (solidEnd > solidStart + 0.05) stops.push(`${segment.color} ${formatStop(solidEnd)}%`);
    cursor = end;
  }

  return `linear-gradient(in oklab to right, ${stops.join(", ")})`;
}

function blendWidth(left: number, right: number): number {
  return Math.min(BLEND, left * 0.4, right * 0.4);
}

function formatStop(value: number): string {
  return (Math.round(value * 10) / 10).toString();
}

export function DistributionFill({ share }: { share: Share }) {
  const style = { "--dist-gradient": distributionGradient(share) } as CSSProperties;
  return <span className="dist-fill" style={style} />;
}

function countLabel(count: number, unit: "judgment" | "outlet"): string {
  if (count === 0) return unit === "outlet" ? "0 outlets" : "0 judgments";
  if (count === 1) return unit === "outlet" ? "1 outlet" : "1 judgment";
  return unit === "outlet" ? `${count} outlets` : `${count} judgments`;
}

function emptyCaption(unit: "judgment" | "outlet"): string {
  return unit === "outlet" ? "No outlets yet" : "No judgments yet";
}

function participantLabel(count: number): string {
  if (count === 1) return "1 Participant";
  return `${count} Participants`;
}

export function DistributionBar({
  label,
  distribution,
  unit = "judgment",
  layout = "stack",
  countAs = "unit",
}: {
  label: string;
  distribution: Distribution;
  unit?: "judgment" | "outlet";
  /** `beside` places the percentage line to the right of the bar. `under` places it beneath, with the count on the right. */
  layout?: "stack" | "beside" | "under";
  /** Dimension rows count the people who judged that dimension. */
  countAs?: "unit" | "participant";
}) {
  const pct = percentages(distribution);
  const caption =
    distribution.count === 0
      ? emptyCaption(unit)
      : `Positive ${pct.positive}% · Mixed ${pct.mixed}% · Negative ${pct.negative}%`;

  const icon = label === "Enjoyment" ? "heart" : label === "Execution" ? "gear" : null;
  const count = countAs === "participant" ? participantLabel(distribution.count) : countLabel(distribution.count, unit);
  const layoutClass = layout === "stack" ? "dist" : `dist dist-${layout}`;

  const bar = (
    <div
      className="dist-bar"
      role="img"
      aria-label={`${label}: ${caption}, from ${count}.`}
    >
      {distribution.count > 0 ? <DistributionFill share={pct} /> : null}
    </div>
  );

  return (
    <div className={layoutClass}>
      <div className="dist-head">
        <strong>
          {icon ? <i className="flair-icon" data-icon={icon} aria-hidden="true" /> : null}
          {label}
        </strong>
        {layout === "under" ? null : <span className="meta">{count}</span>}
      </div>
      {layout === "beside" ? (
        <div className="dist-readout">
          {bar}
          <p className="dist-caption">{caption}</p>
        </div>
      ) : layout === "under" ? (
        <>
          {bar}
          <div className="dist-foot">
            <p className="dist-caption">{caption}</p>
            <span className="meta">{count}</span>
          </div>
        </>
      ) : (
        <>
          {bar}
          <p className="dist-caption">{caption}</p>
        </>
      )}
    </div>
  );
}

export function DistributionTrack({
  name,
  distribution,
  unit = "judgment",
  dense = false,
}: {
  name: string;
  distribution: Distribution;
  unit?: "judgment" | "outlet";
  dense?: boolean;
}) {
  const pct = percentages(distribution);
  const caption =
    distribution.count === 0
      ? emptyCaption(unit)
      : `Positive ${pct.positive}% · Mixed ${pct.mixed}% · Negative ${pct.negative}%`;
  const verdict = distribution.count === 0 ? emptyCaption(unit) : distributionLabel(distribution);

  if (dense) {
    return (
      <div className="paired-track paired-track-dense">
        <ShapeMark distribution={distribution} />
        <span className="track-label">{name}</span>
        <span className="track-verdict">{verdict}</span>
      </div>
    );
  }

  return (
    <div className="paired-track">
      <span className="track-label">{name}</span>
      <div className="paired-track-body">
        <div
          className="dist-bar"
          role="img"
          aria-label={`${name}: ${caption}, from ${countLabel(distribution.count, unit)}.`}
        >
          {distribution.count > 0 ? <DistributionFill share={pct} /> : null}
        </div>
        <div className="dist-head">
          <p className="dist-caption">{caption}</p>
          <span className="meta">{countLabel(distribution.count, unit)}</span>
        </div>
      </div>
    </div>
  );
}

export function PairedDistribution({
  label,
  critics,
  audience,
  showCritics = true,
  showAudience = true,
  dense = false,
}: {
  label: string;
  critics: Distribution;
  audience: Distribution;
  showCritics?: boolean;
  showAudience?: boolean;
  dense?: boolean;
}) {
  return (
    <div className="paired-dist">
      <strong className="paired-heading">{label}</strong>
      {showCritics ? <DistributionTrack name="Critics" distribution={critics} unit="outlet" dense={dense} /> : null}
      {showAudience ? <DistributionTrack name="Audience" distribution={audience} unit="judgment" dense={dense} /> : null}
    </div>
  );
}
