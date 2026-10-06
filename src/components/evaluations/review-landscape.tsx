import {
  criticCoverage,
  crossPopulationNotes,
  pairedDimensions,
  pairedSampleNote,
  type Population,
  type ReviewLandscape,
} from "@/lib/aggregation/landscape";
import { completionLabel, lensLabel, standardLabel } from "@/lib/domain/labels";
import { DimensionShape } from "./dimension-shape";
import { PairedDistribution } from "./distribution-bar";

export function ReviewLandscapeView({
  critics,
  audience,
  population,
  filteredNote,
}: {
  critics: ReviewLandscape;
  audience: ReviewLandscape;
  population?: Population;
  filteredNote?: string;
}) {
  const showCritics = population !== "AUDIENCE";
  const showAudience = population !== "CRITIC";
  const bothPopulated = showCritics && showAudience && critics.sampleSize > 0 && audience.sampleSize > 0;
  const dimensions = pairedDimensions(critics, audience);
  const cross = showCritics && showAudience ? crossPopulationNotes(critics, audience) : { agreement: [], disagreement: [] };
  const agreement = [
    ...cross.agreement,
    ...(showCritics ? labelLines(critics.agreement, "Critics", bothPopulated) : []),
    ...(showAudience ? labelLines(audience.agreement, "Audience", bothPopulated) : []),
  ];
  const disagreement = [
    ...cross.disagreement,
    ...(showCritics ? labelLines(critics.disagreement, "Critics", bothPopulated) : []),
    ...(showAudience ? labelLines(audience.disagreement, "Audience", bothPopulated) : []),
  ];
  const note =
    filteredNote ??
    (population === "CRITIC"
      ? `Critics ${criticCoverage(critics.sampleSize)}.`
      : population === "AUDIENCE"
        ? audience.sampleNote
        : pairedSampleNote(critics, audience));
  const showApproach = (showAudience && audience.sampleSize > 0) || (showCritics && critics.sampleSize > 0);

  return (
    <section className="section" aria-labelledby="landscape-heading">
      <div className="section-head">
        <div>
          <p className="kicker">From the evidence</p>
          <h2 id="landscape-heading">What these evaluations say</h2>
        </div>
        <p>{note}</p>
      </div>
      {critics.sampleSize === 0 && audience.sampleSize === 0 ? (
        <p className="empty">No published evaluations match this view yet.</p>
      ) : (
        <div className="landscape">
          <DimensionShape critics={critics} audience={audience} />
          <div className="split">
            <div className="panel">
              <h3>What reviewers agree on</h3>
              {agreement.length === 0 ? (
                <p className="meta">There isn’t a stable agreement to report from this set.</p>
              ) : (
                <ul className="evidence-list">
                  {agreement.map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
              )}
            </div>
            <div className="panel">
              <h3>Where they disagree</h3>
              {disagreement.length === 0 ? (
                <p className="meta">This set does not show a clear split. That can change as more evaluations arrive.</p>
              ) : (
                <ul className="evidence-list">
                  {disagreement.map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
              )}
            </div>
          </div>
          {dimensions.map((dimension) => (
            <PairedDistribution
              key={dimension.slug}
              label={dimension.name}
              critics={dimension.critics}
              audience={dimension.audience}
              showCritics={showCritics}
              showAudience={showAudience}
            />
          ))}
          {showApproach && showAudience && audience.sampleSize > 0 ? (
            <ApproachSplit
              approachTitle={showCritics && critics.sampleSize > 0 ? "Audience approach" : "Approach"}
              experienceTitle={showCritics && critics.sampleSize > 0 ? "How much the audience experienced" : "How much they experienced"}
              landscape={audience}
            />
          ) : null}
          {showApproach && showCritics && critics.sampleSize > 0 ? (
            <ApproachSplit approachTitle="Critic approach" experienceTitle="How much critics experienced" landscape={critics} />
          ) : null}
        </div>
      )}
    </section>
  );
}

function labelLines(lines: string[], label: string, both: boolean): string[] {
  if (!both) return lines;
  return lines.map((line) => `${label}: ${line}`);
}

function ApproachSplit({
  approachTitle,
  experienceTitle,
  landscape,
}: {
  approachTitle: string;
  experienceTitle: string;
  landscape: ReviewLandscape;
}) {
  return (
    <div className="split">
      <div>
        <h3>{approachTitle}</h3>
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
        <h3>{experienceTitle}</h3>
        <ul className="evidence-list">
          {landscape.completions.map((item) => (
            <li key={item.key}>
              {completionLabel[item.key] ?? item.label} · {item.count}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
