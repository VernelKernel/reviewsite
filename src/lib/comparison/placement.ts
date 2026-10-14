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
  lens: string | null;
  standard: string | null;
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
  context: string[];
};

const LENS_PHRASE: Record<string, string> = {
  EXECUTION: "an execution-focused approach",
  EXPERIENCE: "an experience-focused approach",
  MIXED: "a mixed approach",
};

const STANDARD_PHRASE: Record<string, string> = {
  ABSOLUTE: "an absolute standard",
  CONTEXTUAL: "a contextual standard",
  MIXED: "a mixed standard",
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
  const context = [
    approachSentence(viewer.lens, others.map((row) => row.lens), "approach", LENS_PHRASE),
    approachSentence(viewer.standard, others.map((row) => row.standard), "standard", STANDARD_PHRASE),
  ].filter((line): line is string => Boolean(line));
  return { lines, context };
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

function approachSentence(
  yours: string | null,
  others: (string | null)[],
  noun: "approach" | "standard",
  phrases: Record<string, string>,
): string | null {
  if (!yours || !phrases[yours]) return null;
  const recorded = others.filter((value): value is string => Boolean(value && phrases[value]));
  if (recorded.length === 0) return null;
  const counts = new Map<string, number>();
  for (const value of recorded) counts.set(value, (counts.get(value) ?? 0) + 1);
  let top: string | null = null;
  let topCount = 0;
  let tie = false;
  for (const [value, count] of counts) {
    if (count > topCount) {
      top = value;
      topCount = count;
      tie = false;
    } else if (count === topCount) {
      tie = true;
    }
  }
  if (!top || tie || top === yours) return null;
  const article = noun === "approach" ? "an approach" : "a standard";
  return `You used ${phrases[yours]}. Of ${recorded.length} other evaluations that recorded ${article}, ${topCount} used ${phrases[top]}.`;
}
