export type StanceValue = "POSITIVE" | "MIXED" | "NEGATIVE";
export type LensValue = "EXPERIENCE" | "EXECUTION" | "MIXED";
export type StandardValue = "ABSOLUTE" | "CONTEXTUAL" | "MIXED";
export type PolarityValue = "PRAISE" | "CRITICISM";

export type Distribution = {
  positive: number;
  mixed: number;
  negative: number;
  count: number;
};

export type LandscapeEvaluation = {
  lens: LensValue;
  standard: StandardValue;
  enjoyment: StanceValue;
  execution: StanceValue;
  completion: string;
  judgments: { dimensionSlug: string; dimensionName: string; stance: StanceValue }[];
  observations: { topicSlug: string; topicName: string; polarity: PolarityValue }[];
};

export type CountShare = {
  key: string;
  label: string;
  count: number;
};

export type DimensionLandscape = {
  slug: string;
  name: string;
  distribution: Distribution;
};

export type TopicLandscape = {
  slug: string;
  name: string;
  praise: number;
  criticism: number;
  total: number;
};

export type ReviewLandscape = {
  sampleSize: number;
  enjoyment: Distribution;
  execution: Distribution;
  dimensions: DimensionLandscape[];
  lenses: CountShare[];
  standards: CountShare[];
  completions: CountShare[];
  topics: TopicLandscape[];
  agreement: string[];
  disagreement: string[];
  sampleNote: string;
};

const EARLY = new Set(["JUST_STARTED", "EARLY", "ABANDONED"]);
const COMPLETED = new Set(["COMPLETED", "ENDGAME", "POST_GAME"]);

export function emptyDistribution(): Distribution {
  return { positive: 0, mixed: 0, negative: 0, count: 0 };
}

export function isAggregateEligible(status: string): boolean {
  return status === "PUBLISHED";
}

export function addStance(distribution: Distribution, stance: StanceValue): Distribution {
  return {
    positive: distribution.positive + (stance === "POSITIVE" ? 1 : 0),
    mixed: distribution.mixed + (stance === "MIXED" ? 1 : 0),
    negative: distribution.negative + (stance === "NEGATIVE" ? 1 : 0),
    count: distribution.count + 1,
  };
}

export function percentages(distribution: Distribution): {
  positive: number;
  mixed: number;
  negative: number;
} {
  if (distribution.count === 0) return { positive: 0, mixed: 0, negative: 0 };
  const raw = [
    { key: "positive" as const, value: (distribution.positive / distribution.count) * 100 },
    { key: "mixed" as const, value: (distribution.mixed / distribution.count) * 100 },
    { key: "negative" as const, value: (distribution.negative / distribution.count) * 100 },
  ];
  const floors = raw.map((item) => ({ ...item, floor: Math.floor(item.value), fraction: item.value % 1 }));
  let remainder = 100 - floors.reduce((sum, item) => sum + item.floor, 0);
  floors.sort((a, b) => b.fraction - a.fraction);
  const awarded = new Map<string, number>();
  for (const item of floors) {
    const extra = remainder > 0 ? 1 : 0;
    if (extra) remainder -= 1;
    awarded.set(item.key, item.floor + extra);
  }
  return {
    positive: awarded.get("positive") ?? 0,
    mixed: awarded.get("mixed") ?? 0,
    negative: awarded.get("negative") ?? 0,
  };
}

export function dominantKey(distribution: Distribution): "positive" | "mixed" | "negative" | null {
  if (distribution.count === 0) return null;
  const entries: ["positive" | "mixed" | "negative", number][] = [
    ["positive", distribution.positive],
    ["mixed", distribution.mixed],
    ["negative", distribution.negative],
  ];
  entries.sort((a, b) => b[1] - a[1]);
  if (entries[0][1] === entries[1][1]) return null;
  return entries[0][0];
}

export function distributionLabel(distribution: Distribution): string {
  if (distribution.count === 0) return "No evaluations";
  const dominant = dominantKey(distribution);
  if (!dominant) return distribution.count < 4 ? `Divided · ${distribution.count} so far` : "Divided";
  const share = distribution[dominant] / distribution.count;
  const word = dominant === "positive" ? "positive" : dominant === "mixed" ? "mixed" : "negative";
  if (distribution.count < 4) {
    const titled = word.charAt(0).toUpperCase() + word.slice(1);
    return `${titled} · ${distribution.count} so far`;
  }
  if (share >= 0.75) return `Mostly ${word}`;
  if (share >= 0.5) return `Leaning ${word}`;
  return "Divided";
}

export function sampleNote(count: number): string {
  if (count === 0) return "No published evaluations yet.";
  if (count === 1) return "Based on 1 eval. This is an early picture, not a consensus.";
  if (count < 4) return `Based on ${count} evals. This is an early picture, not a consensus.`;
  return `Based on ${count} evals.`;
}

function stanceWord(key: "positive" | "mixed" | "negative"): string {
  if (key === "positive") return "positive";
  if (key === "mixed") return "mixed";
  return "negative";
}

function shareOf(distribution: Distribution, key: "positive" | "mixed" | "negative"): number {
  if (distribution.count === 0) return 0;
  return distribution[key] / distribution.count;
}

function countGroup(records: { key: string; label: string }[]): CountShare[] {
  const map = new Map<string, CountShare>();
  for (const record of records) {
    const current = map.get(record.key) ?? { key: record.key, label: record.label, count: 0 };
    current.count += 1;
    map.set(record.key, current);
  }
  return [...map.values()].sort((a, b) => b.count - a.count);
}

function executionDistribution(evaluations: LandscapeEvaluation[]): Distribution {
  return evaluations.reduce((distribution, evaluation) => addStance(distribution, evaluation.execution), emptyDistribution());
}

export function buildLandscape(evaluations: LandscapeEvaluation[]): ReviewLandscape {
  const enjoyment = evaluations.reduce(
    (distribution, evaluation) => addStance(distribution, evaluation.enjoyment),
    emptyDistribution(),
  );
  const execution = executionDistribution(evaluations);

  const dimensionMap = new Map<string, DimensionLandscape>();
  const topicMap = new Map<string, TopicLandscape>();

  for (const evaluation of evaluations) {
    for (const judgment of evaluation.judgments) {
      const current = dimensionMap.get(judgment.dimensionSlug) ?? {
        slug: judgment.dimensionSlug,
        name: judgment.dimensionName,
        distribution: emptyDistribution(),
      };
      current.distribution = addStance(current.distribution, judgment.stance);
      dimensionMap.set(judgment.dimensionSlug, current);
    }
    for (const observation of evaluation.observations) {
      const current = topicMap.get(observation.topicSlug) ?? {
        slug: observation.topicSlug,
        name: observation.topicName,
        praise: 0,
        criticism: 0,
        total: 0,
      };
      if (observation.polarity === "PRAISE") current.praise += 1;
      else current.criticism += 1;
      current.total += 1;
      topicMap.set(observation.topicSlug, current);
    }
  }

  const dimensions = [...dimensionMap.values()].sort((a, b) => b.distribution.count - a.distribution.count);
  const topics = [...topicMap.values()].sort((a, b) => b.total - a.total);
  const agreement: string[] = [];
  const disagreement: string[] = [];
  const sampleSize = evaluations.length;

  if (sampleSize >= 4) {
    const enjoymentDominant = dominantKey(enjoyment);
    const executionDominant = dominantKey(execution);
    if (
      enjoymentDominant &&
      executionDominant &&
      enjoymentDominant === executionDominant &&
      shareOf(enjoyment, enjoymentDominant) >= 0.7 &&
      shareOf(execution, executionDominant) >= 0.7
    ) {
      agreement.push(
        `Reviewers largely agree: both enjoyment and execution lean ${stanceWord(enjoymentDominant)}.`,
      );
    }

    const enjoymentPositive = shareOf(enjoyment, "positive");
    const executionPositive = shareOf(execution, "positive");
    if (enjoymentPositive - executionPositive >= 0.3) {
      disagreement.push(
        "Many reviewers enjoyed this work while expressing substantially more negative or mixed opinions about execution.",
      );
    } else if (executionPositive - enjoymentPositive >= 0.3) {
      disagreement.push(
        "Reviewers more often describe the execution as successful than they describe enjoying the work.",
      );
    }

    for (const dimension of dimensions) {
      if (dimension.distribution.count < 4) continue;
      const dominant = dominantKey(dimension.distribution);
      if (!dominant) {
        disagreement.push(`Reviewers disagree about ${dimension.name.toLowerCase()}.`);
        continue;
      }
      const share = shareOf(dimension.distribution, dominant);
      if (share >= 0.75) {
        agreement.push(
          `Reviewers largely describe ${dimension.name.toLowerCase()} as ${stanceWord(dominant)}.`,
        );
      } else if (share <= 0.5) {
        disagreement.push(`Reviewers disagree about ${dimension.name.toLowerCase()}.`);
      }
    }

    for (const topic of topics) {
      if (topic.criticism >= 2 && topic.criticism > topic.praise) {
        disagreement.push(`Several reviewers mention ${topic.name.toLowerCase()} as a criticism.`);
      }
      if (topic.praise >= 2 && topic.praise > topic.criticism) {
        agreement.push(`Several reviewers mention ${topic.name.toLowerCase()} as praise.`);
      }
    }

    const absolute = evaluations.filter((evaluation) => evaluation.standard === "ABSOLUTE");
    const contextual = evaluations.filter((evaluation) => evaluation.standard === "CONTEXTUAL");
    if (absolute.length >= 2 && contextual.length >= 2) {
      const absolutePositive = shareOf(executionDistribution(absolute), "positive");
      const contextualPositive = shareOf(executionDistribution(contextual), "positive");
      if (Math.abs(absolutePositive - contextualPositive) >= 0.34) {
        disagreement.push(
          "Reviewers who adjusted their expectations and reviewers who did not describe execution differently.",
        );
      }
    }

    const early = evaluations.filter((evaluation) => EARLY.has(evaluation.completion));
    const completed = evaluations.filter((evaluation) => COMPLETED.has(evaluation.completion));
    if (early.length >= 2 && completed.length >= 2) {
      const earlyPositive = shareOf(
        early.reduce((distribution, evaluation) => addStance(distribution, evaluation.enjoyment), emptyDistribution()),
        "positive",
      );
      const completedPositive = shareOf(
        completed.reduce((distribution, evaluation) => addStance(distribution, evaluation.enjoyment), emptyDistribution()),
        "positive",
      );
      if (Math.abs(earlyPositive - completedPositive) >= 0.34) {
        disagreement.push("Early impressions and completed-play evaluations do not describe enjoyment the same way.");
      }
    }
  }

  return {
    sampleSize,
    enjoyment,
    execution,
    dimensions,
    lenses: countGroup(
      evaluations.map((evaluation) => ({
        key: evaluation.lens,
        label:
          evaluation.lens === "EXECUTION"
            ? "Execution-focused"
            : evaluation.lens === "EXPERIENCE"
              ? "Experience-focused"
              : "Mixed approach",
      })),
    ),
    standards: countGroup(
      evaluations.map((evaluation) => ({
        key: evaluation.standard,
        label:
          evaluation.standard === "ABSOLUTE"
            ? "Absolute standards"
            : evaluation.standard === "CONTEXTUAL"
              ? "Contextual standards"
              : "Mixed standards",
      })),
    ),
    completions: countGroup(evaluations.map((evaluation) => ({ key: evaluation.completion, label: evaluation.completion }))),
    topics,
    agreement: unique(agreement).slice(0, 4),
    disagreement: unique(disagreement).slice(0, 5),
    sampleNote: sampleNote(sampleSize),
  };
}

function unique(values: string[]): string[] {
  return [...new Set(values)];
}

export function enjoymentExecutionGap(landscape: ReviewLandscape): number | null {
  return stanceShareGaps(landscape)?.positive ?? null;
}

/** Enjoyment’s share minus execution’s share, in percentage points. Null below four evaluations. */
export function stanceShareGaps(landscape: ReviewLandscape): {
  positive: number;
  mixed: number;
  negative: number;
} | null {
  if (landscape.sampleSize < 4) return null;
  const enjoyment = percentages(landscape.enjoyment);
  const execution = percentages(landscape.execution);
  return {
    positive: enjoyment.positive - execution.positive,
    mixed: enjoyment.mixed - execution.mixed,
    negative: enjoyment.negative - execution.negative,
  };
}
