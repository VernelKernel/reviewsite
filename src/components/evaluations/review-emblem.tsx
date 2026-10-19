import { ShapeMark } from "@/components/evaluations/shape-mark";
import { distributionLabel, type Distribution } from "@/lib/aggregation/landscape";

type IconName = "glasses" | "heart" | "audience" | "gear";

type Facet = {
  place: "north" | "east" | "south" | "west";
  group: string;
  name: string;
  distribution: Distribution;
  who: IconName;
  what: IconName;
};

export function ReviewEmblem({
  critics,
  audience,
  compact = false,
  decorative = false,
  spin = false,
}: {
  critics: { enjoyment: Distribution; execution: Distribution };
  audience: { enjoyment: Distribution; execution: Distribution };
  compact?: boolean;
  decorative?: boolean;
  spin?: boolean;
}) {
  const facets: Facet[] = [
    { place: "north", group: "Critics", name: "Enjoyment", distribution: critics.enjoyment, who: "glasses", what: "heart" },
    { place: "west", group: "Critics", name: "Execution", distribution: critics.execution, who: "glasses", what: "gear" },
    { place: "east", group: "Audience", name: "Enjoyment", distribution: audience.enjoyment, who: "audience", what: "heart" },
    { place: "south", group: "Audience", name: "Execution", distribution: audience.execution, who: "audience", what: "gear" },
  ];
  const label = facets.map((facet) => `${facet.group} ${facet.name.toLowerCase()}, ${distributionLabel(facet.distribution)}`).join(". ");

  return (
    <div
      className={compact ? "emblem emblem-compact" : "emblem"}
      role={decorative ? undefined : "img"}
      aria-label={decorative ? undefined : label}
      aria-hidden={decorative ? true : undefined}
    >
      {facets.map((facet, index) => (
        <div key={facet.place} className={`emblem-facet emblem-${facet.place}`}>
          <ShapeMark distribution={facet.distribution} spin={spin} phase={index / facets.length} />
          <span className="emblem-marks">
            <span className={`emblem-icon emblem-icon-${facet.who}`} />
            <span className={`emblem-icon emblem-icon-${facet.what}`} />
          </span>
        </div>
      ))}
    </div>
  );
}
