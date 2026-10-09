import { GapCallouts } from "@/components/comparison/gap-callouts";
import { DistributionBar } from "@/components/evaluations/distribution-bar";
import { criticCoverage, populationShapeNote, type ReviewLandscape } from "@/lib/aggregation/landscape";

export function PopulationGauges({
  critics,
  audience,
  showGap = true,
  heading = "h2",
  criticHref,
  audienceHref,
}: {
  critics: ReviewLandscape;
  audience: ReviewLandscape;
  showGap?: boolean;
  heading?: "h2" | "h3";
  criticHref?: string;
  audienceHref?: string;
}) {
  const note = populationShapeNote(critics, audience);
  const Title = heading;

  return (
    <div className="population-groups">
      <section className="population-group" aria-label="Critics">
        <div className="population-head">
          <Title className="population-title">Critics</Title>
          <SampleLink href={criticHref}>{`Based on ${criticCoverage(critics.coverageCount)}`}</SampleLink>
        </div>
        <DistributionBar label="Enjoyment" distribution={critics.enjoyment} unit="outlet" />
        <DistributionBar label="Execution" distribution={critics.execution} unit="outlet" />
      </section>
      <section className="population-group" aria-label="Audience">
        <div className="population-head">
          <Title className="population-title">Audience</Title>
          <SampleLink href={audienceHref}>{audience.sampleNote}</SampleLink>
        </div>
        <DistributionBar label="Enjoyment" distribution={audience.enjoyment} />
        <DistributionBar label="Execution" distribution={audience.execution} />
        {showGap ? <GapCallouts landscape={audience} /> : null}
      </section>
      {note ? <p className="population-shape">{note}</p> : null}
    </div>
  );
}

function SampleLink({ href, children }: { href?: string; children: string }) {
  if (!href) return <p className="sample-note">{children}</p>;
  return (
    <a className="sample-link" href={href}>
      {children}
    </a>
  );
}
