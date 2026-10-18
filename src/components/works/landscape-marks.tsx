import { ShapeMark } from "@/components/evaluations/shape-mark";
import { distributionLabel, type Distribution } from "@/lib/aggregation/landscape";

export function LandscapeMarks({
  critics,
  audience,
}: {
  critics: { enjoyment: Distribution; execution: Distribution };
  audience: { enjoyment: Distribution; execution: Distribution };
}) {
  return (
    <div className="profile-marks">
      <Mark group="Critics" name="Enjoyment" distribution={critics.enjoyment} />
      <Mark group="Critics" name="Execution" distribution={critics.execution} />
      <span className="profile-mark-rule" aria-hidden="true" />
      <Mark group="Audience" name="Enjoyment" distribution={audience.enjoyment} />
      <Mark group="Audience" name="Execution" distribution={audience.execution} />
    </div>
  );
}

function Mark({ group, name, distribution }: { group: string; name: string; distribution: Distribution }) {
  const verdict = distributionLabel(distribution);
  return (
    <span className="profile-mark" tabIndex={0} role="img" aria-label={`${group} ${name.toLowerCase()}: ${verdict}`} data-tooltip={verdict}>
      <ShapeMark distribution={distribution} />
    </span>
  );
}
