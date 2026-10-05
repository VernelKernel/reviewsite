import { percentages, type Distribution } from "@/lib/aggregation/landscape";

export function DistributionBar({
  label,
  distribution,
}: {
  label: string;
  distribution: Distribution;
}) {
  const pct = percentages(distribution);
  const caption =
    distribution.count === 0
      ? "No judgments yet"
      : `Positive ${pct.positive}% · Mixed ${pct.mixed}% · Negative ${pct.negative}%`;

  return (
    <div className="dist">
      <div className="dist-head">
        <strong>{label}</strong>
        <span className="meta">
          {distribution.count} {distribution.count === 1 ? "judgment" : "judgments"}
        </span>
      </div>
      <div
        className="dist-bar"
        role="img"
        aria-label={`${label}: ${caption}, from ${distribution.count} evaluations.`}
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
