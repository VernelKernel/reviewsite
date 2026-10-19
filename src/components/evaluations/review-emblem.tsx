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
}: {
  critics: { enjoyment: Distribution; execution: Distribution };
  audience: { enjoyment: Distribution; execution: Distribution };
}) {
  const facets: Facet[] = [
    { place: "north", group: "Critics", name: "Enjoyment", distribution: critics.enjoyment, who: "glasses", what: "heart" },
    { place: "west", group: "Critics", name: "Execution", distribution: critics.execution, who: "glasses", what: "gear" },
    { place: "east", group: "Audience", name: "Enjoyment", distribution: audience.enjoyment, who: "audience", what: "heart" },
    { place: "south", group: "Audience", name: "Execution", distribution: audience.execution, who: "audience", what: "gear" },
  ];
  const label = facets.map((facet) => `${facet.group} ${facet.name.toLowerCase()}, ${distributionLabel(facet.distribution)}`).join(". ");

  return (
    <div className="emblem" role="img" aria-label={label}>
      {facets.map((facet) => (
        <div key={facet.place} className={`emblem-facet emblem-${facet.place}`}>
          <ShapeMark distribution={facet.distribution} />
          <span className="emblem-marks">
            <span className={`emblem-icon emblem-icon-${facet.who}`} />
            <span className={`emblem-icon emblem-icon-${facet.what}`} />
          </span>
        </div>
      ))}
    </div>
  );
}
