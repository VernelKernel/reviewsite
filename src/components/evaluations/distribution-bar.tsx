"use client";

import { useId, type CSSProperties } from "react";
import { distributionLabel, percentages, type Distribution } from "@/lib/aggregation/landscape";
import { ShapeMark } from "@/components/evaluations/shape-mark";

const BLEND = 5;

type Share = { positive: number; mixed: number; negative: number };

type StanceKey = "positive" | "mixed" | "negative";

/** Stop positions for the blended distribution bar. A single reading is two stops of one color. */
export function distributionStops(share: Share): { at: number; key: StanceKey }[] {
  const segments: { width: number; key: StanceKey }[] = [
    { width: share.positive, key: "positive" },
    { width: share.mixed, key: "mixed" },
    { width: share.negative, key: "negative" },
  ].filter((segment) => segment.width > 0);

  if (segments.length === 0) return [];
  if (segments.length === 1) return [
    { at: 0, key: segments[0].key },
    { at: 100, key: segments[0].key },
  ];

  const stops: { at: number; key: StanceKey }[] = [];
  let cursor = 0;
  for (let index = 0; index < segments.length; index += 1) {
    const segment = segments[index];
    const start = cursor;
    const end = cursor + segment.width;
    const blendBefore = index === 0 ? 0 : blendWidth(segments[index - 1].width, segment.width);
    const blendAfter = index === segments.length - 1 ? 0 : blendWidth(segment.width, segments[index + 1].width);
    const solidStart = start + blendBefore;
    const solidEnd = end - blendAfter;
    if (index === 0) stops.push({ at: 0, key: segment.key });
    else stops.push({ at: formatStop(solidStart), key: segment.key });
    if (index === segments.length - 1) stops.push({ at: 100, key: segment.key });
    else if (solidEnd > solidStart + 0.05) stops.push({ at: formatStop(solidEnd), key: segment.key });
    cursor = end;
  }
  return stops;
}

/** Soft join only where two stance colors actually meet, so a single reading stays flat. */
export function distributionGradient(share: Share): string {
  const stops = distributionStops(share);
  if (stops.length === 0) return "transparent";
  const color: Record<StanceKey, string> = {
    positive: "var(--color-positive)",
    mixed: "var(--color-caution)",
    negative: "var(--color-negative)",
  };
  if (stops.every((stop) => stop.key === stops[0].key)) return color[stops[0].key];
  return `linear-gradient(in oklab to right, ${stops.map((stop) => `${color[stop.key]} ${stop.at}%`).join(", ")})`;
}

function blendWidth(left: number, right: number): number {
  return Math.min(BLEND, left * 0.4, right * 0.4);
}

function formatStop(value: number): number {
  return Math.round(value * 10) / 10;
}

export function DistributionFill({ share }: { share: Share }) {
  const style = { "--dist-gradient": distributionGradient(share) } as CSSProperties;
  return <span className="dist-fill" style={style} />;
}

function countLabel(count: number, unit: "judgment" | "outlet"): string {
  if (unit === "judgment") return reviewerLabel(count);
  if (count === 0) return "No outlets yet";
  if (count === 1) return "1 outlet";
  return `${count} outlets`;
}

function emptyCaption(unit: "judgment" | "outlet"): string {
  return unit === "outlet" ? "No outlets yet" : "No reviewers yet";
}

function reviewerLabel(count: number): string {
  if (count === 0) return "No reviewers yet";
  if (count === 1) return "1 reviewer";
  return `${count} reviewers`;
}

function reviewerCount(unit: "judgment" | "outlet", countAs: "unit" | "participant"): boolean {
  return countAs === "participant" || unit === "judgment";
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
  const reviewers = reviewerCount(unit, countAs);
  const count = reviewers ? reviewerLabel(distribution.count) : countLabel(distribution.count, unit);
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
        <ReadingLabel label={label} icon={icon} tip={count} />
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
        <ReadingLabel label={name} icon={null} className="track-label" tip={countLabel(distribution.count, unit)} />
        <span className="track-verdict">{verdict}</span>
      </div>
    );
  }

  return (
    <div className="paired-track">
      <ReadingLabel label={name} icon={null} className="track-label" tip={countLabel(distribution.count, unit)} />
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
        </div>
      </div>
    </div>
  );
}

export function CountTip({
  label,
  tip,
  href,
  current = false,
}: {
  label: string;
  tip: string;
  href?: string;
  current?: boolean;
}) {
  const tipId = useId();
  const bubble = (
    <span id={tipId} className="dist-tip" role="tooltip">
      {tip}
    </span>
  );
  if (href) {
    return (
      <a className="dist-tip-wrap" href={href} aria-describedby={tipId} aria-current={current ? "page" : undefined}>
        {label}
        {bubble}
      </a>
    );
  }
  return (
    <span className="dist-tip-wrap">
      <button type="button" className="dist-tip-hit" aria-describedby={tipId}>
        {label}
      </button>
      {bubble}
    </span>
  );
}

function ReadingLabel({
  label,
  icon,
  tip,
  className,
}: {
  label: string;
  icon: string | null;
  tip: string | null;
  className?: string;
}) {
  const tipId = useId();
  const text = (
    <>
      {icon ? <i className="flair-icon" data-icon={icon} aria-hidden="true" /> : null}
      {label}
    </>
  );
  if (!tip) return <strong className={className}>{text}</strong>;
  return (
    <strong className={className ? `dist-tip-wrap ${className}` : "dist-tip-wrap"}>
      <button type="button" className="dist-tip-hit" aria-describedby={tipId}>
        {text}
      </button>
      <span id={tipId} className="dist-tip" role="tooltip">
        {tip}
      </span>
    </strong>
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
