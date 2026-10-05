import type { ReviewLandscape } from "@/lib/aggregation/landscape";
import { completionLabel, lensLabel, standardLabel } from "@/lib/domain/labels";
import { DistributionBar } from "./distribution-bar";

export function ReviewLandscapeView({
  landscape,
  filteredNote,
}: {
  landscape: ReviewLandscape;
  filteredNote?: string;
}) {
  return (
    <section className="section" aria-labelledby="landscape-heading">
      <div className="section-head">
        <div>
          <p className="kicker">From the evidence</p>
          <h2 id="landscape-heading">What these evaluations say</h2>
        </div>
        <p>{filteredNote ?? landscape.sampleNote}</p>
      </div>
      {landscape.sampleSize === 0 ? (
        <p className="empty">No published evaluations match this view yet.</p>
      ) : (
        <div className="landscape">
          <div className="split">
            <div className="panel">
              <h3>What reviewers agree on</h3>
              {landscape.agreement.length === 0 ? (
                <p className="meta">There isn’t a stable agreement to report from this set.</p>
              ) : (
                <ul className="evidence-list">
                  {landscape.agreement.map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
              )}
            </div>
            <div className="panel">
              <h3>Where they disagree</h3>
              {landscape.disagreement.length === 0 ? (
                <p className="meta">This set does not show a clear split. That can change as more evaluations arrive.</p>
              ) : (
                <ul className="evidence-list">
                  {landscape.disagreement.map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
              )}
            </div>
          </div>
          <DistributionBar label="Enjoyment" distribution={landscape.enjoyment} />
          <DistributionBar label="Execution" distribution={landscape.execution} />
          {landscape.dimensions.map((dimension) => (
            <DistributionBar key={dimension.slug} label={dimension.name} distribution={dimension.distribution} />
          ))}
          <div className="split">
            <div>
              <h3>Approach</h3>
              <ul className="evidence-list">
                {landscape.lenses.map((item) => (
                  <li key={item.key}>
                    {lensLabel[item.key] ?? item.label} · {item.count}
                  </li>
                ))}
                {landscape.standards.map((item) => (
                  <li key={item.key}>
                    {standardLabel[item.key] ?? item.label} · {item.count}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3>How much they experienced</h3>
              <ul className="evidence-list">
                {landscape.completions.map((item) => (
                  <li key={item.key}>
                    {completionLabel[item.key] ?? item.label} · {item.count}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
