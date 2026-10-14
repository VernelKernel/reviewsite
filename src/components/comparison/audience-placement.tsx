import type { AudiencePlacement } from "@/lib/comparison/placement";
import { MarkedDistribution } from "./marked-distribution";

export function AudiencePlacementView({ placement }: { placement: AudiencePlacement }) {
  return (
    <section className="section" aria-labelledby="audience-placement-heading">
      <div className="section-head">
        <div>
          <p className="kicker">Your evaluation</p>
          <h2 id="audience-placement-heading">Where you sit among other players</h2>
        </div>
      </div>
      <div className="placement-lines">
        {placement.lines.map((line) => (
          <div key={line.key}>
            <p>{line.sentence}</p>
            {line.others.count > 0 ? (
              <MarkedDistribution label={line.label} distribution={line.others} stance={line.yours} unit="evaluation" />
            ) : null}
          </div>
        ))}
      </div>
      {placement.context.length > 0 ? (
        <ul className="evidence-list">
          {placement.context.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
