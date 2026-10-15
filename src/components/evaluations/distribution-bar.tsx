import { distributionLabel, percentages, type Distribution } from "@/lib/aggregation/landscape";
import { ShapeMark } from "@/components/evaluations/shape-mark";

function countLabel(count: number, unit: "judgment" | "outlet"): string {
  if (count === 0) return unit === "outlet" ? "0 outlets" : "0 judgments";
  if (count === 1) return unit === "outlet" ? "1 outlet" : "1 judgment";
  return unit === "outlet" ? `${count} outlets` : `${count} judgments`;
}

function emptyCaption(unit: "judgment" | "outlet"): string {
  return unit === "outlet" ? "No outlets yet" : "No judgments yet";
}

export function DistributionBar({
  label,
  distribution,
  unit = "judgment",
}: {
  label: string;
  distribution: Distribution;
  unit?: "judgment" | "outlet";
}) {
  const pct = percentages(distribution);
  const caption =
    distribution.count === 0
      ? emptyCaption(unit)
      : `Positive ${pct.positive}% · Mixed ${pct.mixed}% · Negative ${pct.negative}%`;

  const icon = label === "Enjoyment" ? "heart" : label === "Execution" ? "gear" : null;

  return (
    <div className="dist">
      <div className="dist-head">
        <strong>
          {icon ? <i className="flair-icon" data-icon={icon} aria-hidden="true" /> : null}
          {label}
        </strong>
        <span className="meta">{countLabel(distribution.count, unit)}</span>
      </div>
      <div
        className="dist-bar"
        role="img"
        aria-label={`${label}: ${caption}, from ${countLabel(distribution.count, unit)}.`}
      >
        {distribution.count > 0 ? (
          <>
            <span className="dist-positive" style={{ width: `${pct.positive}%` }} />
            <span className="dist-mixed" style={{ width: `${pct.mixed}%` }} />
            <span className="dist-negative" style={{ width: `${pct.negative}%` }} />
          </>
        ) : null}
      </div>
      <p className="dist-caption">{caption}</p>
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
          {distribution.count > 0 ? (
            <>
              <span className="dist-positive" style={{ width: `${pct.positive}%` }} />
              <span className="dist-mixed" style={{ width: `${pct.mixed}%` }} />
              <span className="dist-negative" style={{ width: `${pct.negative}%` }} />
            </>
          ) : null}
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
