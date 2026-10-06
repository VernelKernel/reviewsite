import { GapCallouts } from "@/components/comparison/gap-callouts";
import { DistributionBar } from "@/components/evaluations/distribution-bar";
import { criticCoverage, populationShapeNote, type ReviewLandscape } from "@/lib/aggregation/landscape";

export function PopulationGauges({
  critics,
  audience,
  showGap = true,
  heading = "h2",
}: {
  critics: ReviewLandscape;
  audience: ReviewLandscape;
  showGap?: boolean;
  heading?: "h2" | "h3";
}) {
  const note = populationShapeNote(critics, audience);
  const Title = heading;

  return (
    <div className="population-groups">
      <section className="population-group" aria-label="Critics">
        <div className="population-head">
          <Title className="population-title">Critics</Title>
          <p className="sample-note">{criticCoverage(critics.sampleSize)}</p>
        </div>
        <DistributionBar label="Enjoyment" distribution={critics.enjoyment} unit="outlet" />
        <DistributionBar label="Execution" distribution={critics.execution} unit="outlet" />
      </section>
      <section className="population-group" aria-label="Audience">
        <div className="population-head">
          <Title className="population-title">Audience</Title>
          <p className="sample-note">{audience.sampleNote}</p>
        </div>
        <DistributionBar label="Enjoyment" distribution={audience.enjoyment} />
        <DistributionBar label="Execution" distribution={audience.execution} />
        {showGap ? <GapCallouts landscape={audience} /> : null}
      </section>
      {note ? <p className="population-shape">{note}</p> : null}
    </div>
  );
}
