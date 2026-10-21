import { addStance, dominantKey, emptyDistribution, type Distribution, type StanceValue } from "@/lib/aggregation/landscape";

export type PlacementJudgment = {
  slug: string;
  name: string;
  stance: StanceValue;
};

export type PlacementEvaluation = {
  reviewerId: string;
  enjoyment: StanceValue;
  execution: StanceValue;
  judgments: PlacementJudgment[];
};

export type PlacementLine = {
  key: string;
  label: string;
  yours: StanceValue;
  others: Distribution;
  sentence: string;
};

export type AudiencePlacement = {
  lines: PlacementLine[];
};

export function placeAudience(viewer: PlacementEvaluation, rows: PlacementEvaluation[]): AudiencePlacement {
  const others = rows.filter((row) => row.reviewerId !== viewer.reviewerId);
  const lines = [
    stanceLine("enjoyment", "Enjoyment", viewer.enjoyment, others.map((row) => row.enjoyment), "field"),
    stanceLine("execution", "Execution", viewer.execution, others.map((row) => row.execution), "field"),
    ...viewer.judgments.map((judgment) =>
      stanceLine(
        judgment.slug,
        judgment.name,
        judgment.stance,
        others.flatMap((row) => {
          const match = row.judgments.find((item) => item.slug === judgment.slug);
          return match ? [match.stance] : [];
        }),
        "dimension",
      ),
    ),
  ];
  return { lines };
}

function stanceLine(
  key: string,
  label: string,
  yours: StanceValue,
  stances: StanceValue[],
  kind: "field" | "dimension",
): PlacementLine {
  const others = stances.reduce((distribution, stance) => addStance(distribution, stance), emptyDistribution());
  return { key, label, yours, others, sentence: audienceSentence(label, yours, others, kind) };
}

function audienceSentence(label: string, yours: StanceValue, others: Distribution, kind: "field" | "dimension"): string {
  const stance = yours.toLowerCase();
  const lead = kind === "dimension" ? `You call ${label.toLowerCase()} ${stance}.` : `Your ${label.toLowerCase()} is ${stance}.`;
  if (others.count === 0) return `${lead} No other published audience evaluations are in this set.`;
  if (others.count === 1) {
    const only = others.positive ? "positive" : others.mixed ? "mixed" : "negative";
    const who = kind === "dimension" ? `evaluation that judged ${label.toLowerCase()}` : "published audience evaluation";
    return `${lead} The other ${who} is ${only}.`;
  }
  const who =
    kind === "dimension"
      ? `${others.count} other evaluations that judged ${label.toLowerCase()}`
      : `${others.count} other published audience evaluations`;
  const divided = dominantKey(others) === null ? " That set is divided." : "";
  return `${lead} Of ${who}, ${countPhrase(others)}.${divided}`;
}

export function countPhrase(distribution: Distribution): string {
  const parts = [
    distribution.positive ? `${distribution.positive} ${distribution.positive === 1 ? "is" : "are"} positive` : null,
    distribution.mixed ? `${distribution.mixed} ${distribution.mixed === 1 ? "is" : "are"} mixed` : null,
    distribution.negative ? `${distribution.negative} ${distribution.negative === 1 ? "is" : "are"} negative` : null,
  ].filter((part): part is string => Boolean(part));
  if (parts.length <= 1) return parts[0] ?? "none recorded a stance";
  if (parts.length === 2) return `${parts[0]} and ${parts[1]}`;
  return `${parts[0]}, ${parts[1]}, and ${parts[2]}`;
}
