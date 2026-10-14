import { percentages, type Distribution, type StanceValue } from "@/lib/aggregation/landscape";
import { stanceLabel } from "@/lib/domain/labels";

export function MarkedDistribution({
  label,
  distribution,
  stance,
  unit,
}: {
  label: string;
  distribution: Distribution;
  stance: StanceValue;
  unit: "evaluation" | "outlet";
}) {
  const pct = percentages(distribution);
  const position = markerPosition(pct, stance);
  const edge = position <= 2 ? "start" : position >= 98 ? "end" : undefined;
  const caption = `${stanceLabel[stance] ?? stance}. ${distribution.positive} positive, ${distribution.mixed} mixed, ${distribution.negative} negative.`;

  return (
    <div className="marked-dist">
      <div className="marked-track">
        <span className="stance-marker" data-edge={edge} style={{ ["--marker" as string]: `${position}%` }}>
          You
        </span>
        <div
          className="dist-bar"
          role="img"
          aria-label={`${label}: you are ${stance.toLowerCase()}. ${caption} From ${distribution.count} ${unit === "outlet" ? "outlets" : "evaluations"}.`}
        >
          {distribution.count > 0 ? (
            <>
              <span className="dist-positive" style={{ width: `${pct.positive}%` }} />
              <span className="dist-mixed" style={{ width: `${pct.mixed}%` }} />
              <span className="dist-negative" style={{ width: `${pct.negative}%` }} />
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function markerPosition(
  pct: { positive: number; mixed: number; negative: number },
  stance: StanceValue,
): number {
  if (stance === "POSITIVE") return pct.positive > 0 ? pct.positive / 2 : 0;
  if (stance === "MIXED") return pct.mixed > 0 ? pct.positive + pct.mixed / 2 : pct.positive;
  return pct.negative > 0 ? 100 - pct.negative / 2 : 100;
}
