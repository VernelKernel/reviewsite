import { stanceShareGaps, type ReviewLandscape } from "@/lib/aggregation/landscape";

const STANCES = [
  { key: "positive", label: "Positive" },
  { key: "mixed", label: "Mixed" },
  { key: "negative", label: "Negative" },
] as const;

function reading(label: string, gap: number): string {
  if (gap === 0) return `${label}: enjoyment and execution have the same share.`;
  const points = Math.abs(gap);
  const relation = gap > 0 ? "ahead of" : "behind";
  return `${label}: enjoyment is ${points} percentage points ${relation} execution.`;
}

export function GapCallouts({
  landscape,
  placement = "inline",
}: {
  landscape: ReviewLandscape;
  placement?: "inline" | "overlay";
}) {
  const gaps = stanceShareGaps(landscape);
  if (!gaps) return null;

  return (
    <figure className={placement === "overlay" ? "gap-callouts gap-callouts-overlay" : "gap-callouts"}>
      <div className="gap-callout-row">
        {STANCES.map((stance) => {
          const gap = gaps[stance.key];
          const tone = gap === 0 ? "gap-even" : `stance stance-${stance.key}`;
          return (
            <div className="gap-callout" key={stance.key}>
              <span className={`gap-callout-label stance stance-${stance.key}`}>{stance.label}</span>
              <p className={`gap-figure ${tone}`} aria-label={reading(stance.label, gap)}>
                {gap === 0 ? null : (
                  <span className="gap-arrow" aria-hidden="true">
                    {gap > 0 ? "↑" : "↓"}
                  </span>
                )}
                <span aria-hidden="true">{Math.abs(gap)}</span>
                <span className="gap-unit" aria-hidden="true">
                  %
                </span>
              </p>
            </div>
          );
        })}
      </div>
      <figcaption className="meta">Enjoyment/Execution Gap</figcaption>
    </figure>
  );
}
