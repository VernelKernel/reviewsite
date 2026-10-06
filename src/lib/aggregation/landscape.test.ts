import { describe, expect, it } from "vitest";
import {
  addStance,
  buildLandscape,
  cardCountLine,
  criticCoverage,
  crossPopulationNotes,
  dimensionShapeReading,
  distributionLabel,
  emptyDistribution,
  enjoymentExecutionGap,
  pairedSampleNote,
  populationShapeNote,
  splitLandscapes,
  stanceShareGaps,
  isAggregateEligible,
  percentages,
  sampleNote,
  type LandscapeEvaluation,
  type PopulatedEvaluation,
} from "./landscape";

function evaluation(overrides: Partial<LandscapeEvaluation> = {}): LandscapeEvaluation {
  return {
    lens: "MIXED",
    standard: "ABSOLUTE",
    enjoyment: "POSITIVE",
    execution: "POSITIVE",
    completion: "COMPLETED",
    judgments: [],
    observations: [],
    ...overrides,
  };
}

describe("aggregate eligibility", () => {
  it("includes only published evaluations", () => {
    expect(isAggregateEligible("PUBLISHED")).toBe(true);
    expect(isAggregateEligible("DRAFT")).toBe(false);
    expect(isAggregateEligible("UNLISTED")).toBe(false);
    expect(isAggregateEligible("HIDDEN")).toBe(false);
    expect(isAggregateEligible("REMOVED")).toBe(false);
  });
});

describe("distributions", () => {
  it("keeps a split distinct from a mixed consensus", () => {
    const split = ["POSITIVE", "NEGATIVE"].reduce(
      (distribution, stance) => addStance(distribution, stance as "POSITIVE" | "NEGATIVE"),
      emptyDistribution(),
    );
    const mixed = addStance(addStance(emptyDistribution(), "MIXED"), "MIXED");
    expect(percentages(split)).toEqual({ positive: 50, mixed: 0, negative: 50 });
    expect(percentages(mixed)).toEqual({ positive: 0, mixed: 100, negative: 0 });
    expect(distributionLabel(split)).toBe("Divided · 2 so far");
    expect(distributionLabel(mixed)).toBe("Mixed · 2 so far");
  });

  it("rounds percentages so they sum to 100", () => {
    let distribution = emptyDistribution();
    distribution = addStance(distribution, "POSITIVE");
    distribution = addStance(distribution, "POSITIVE");
    distribution = addStance(distribution, "MIXED");
    const result = percentages(distribution);
    expect(result.positive + result.mixed + result.negative).toBe(100);
  });

  it("does not describe a small sample as a consensus", () => {
    expect(sampleNote(3)).toMatch(/not a consensus/);
    expect(sampleNote(12)).toBe("Based on 12 evals.");
    expect(sampleNote(0)).toMatch(/No published/);
  });
});

describe("review landscape", () => {
  it("preserves enjoyment and execution independently", () => {
    const landscape = buildLandscape([
      evaluation({ enjoyment: "POSITIVE", execution: "NEGATIVE" }),
      evaluation({ enjoyment: "POSITIVE", execution: "NEGATIVE" }),
      evaluation({ enjoyment: "POSITIVE", execution: "MIXED" }),
      evaluation({ enjoyment: "MIXED", execution: "NEGATIVE" }),
    ]);
    expect(landscape.sampleSize).toBe(4);
    expect(landscape.enjoyment.positive).toBe(3);
    expect(landscape.execution.negative).toBe(3);
    expect(landscape.disagreement.some((line) => line.includes("enjoyed this work"))).toBe(true);
    expect(enjoymentExecutionGap(landscape)).toBeGreaterThan(0);
    expect(stanceShareGaps(landscape)).toEqual({ positive: 75, mixed: 0, negative: -75 });
  });

  it("aggregates a dimension from the reviewers who judged it", () => {
    const landscape = buildLandscape([
      evaluation({
        judgments: [{ dimensionSlug: "music", dimensionName: "Music", stance: "POSITIVE" }],
      }),
      evaluation({
        judgments: [{ dimensionSlug: "music", dimensionName: "Music", stance: "POSITIVE" }],
      }),
      evaluation(),
    ]);
    expect(landscape.dimensions[0]).toMatchObject({
      slug: "music",
      distribution: { positive: 2, mixed: 0, negative: 0, count: 2 },
    });
  });

  it("notes when standards groups describe execution differently", () => {
    const landscape = buildLandscape([
      evaluation({ standard: "CONTEXTUAL", execution: "POSITIVE" }),
      evaluation({ standard: "CONTEXTUAL", execution: "POSITIVE" }),
      evaluation({ standard: "ABSOLUTE", execution: "NEGATIVE" }),
      evaluation({ standard: "ABSOLUTE", execution: "NEGATIVE" }),
    ]);
    expect(landscape.disagreement.some((line) => line.includes("expectations"))).toBe(true);
  });

  it("keeps critics and audience in separate samples", () => {
    const critic = (overrides: Partial<LandscapeEvaluation> = {}): PopulatedEvaluation => ({
      ...evaluation(overrides),
      population: "CRITIC",
    });
    const audience = (overrides: Partial<LandscapeEvaluation> = {}): PopulatedEvaluation => ({
      ...evaluation(overrides),
      population: "AUDIENCE",
    });
    const paired = splitLandscapes([
      critic({ enjoyment: "POSITIVE", execution: "POSITIVE" }),
      critic({ enjoyment: "POSITIVE", execution: "POSITIVE" }),
      critic({ enjoyment: "POSITIVE", execution: "POSITIVE" }),
      critic({ enjoyment: "POSITIVE", execution: "POSITIVE" }),
      audience({ enjoyment: "POSITIVE", execution: "MIXED" }),
      audience({ enjoyment: "POSITIVE", execution: "MIXED" }),
      audience({ enjoyment: "MIXED", execution: "MIXED" }),
      audience({ enjoyment: "MIXED", execution: "MIXED" }),
    ]);
    expect(paired.critics.sampleSize).toBe(4);
    expect(paired.audience.sampleSize).toBe(4);
    expect(paired.critics.execution.positive).toBe(4);
    expect(paired.audience.execution.mixed).toBe(4);
    expect(populationShapeNote(paired.critics, paired.audience)).toBe(
      "Critics are mostly positive on execution. Audience evaluations are mostly mixed.",
    );
    expect(populationShapeNote(paired.critics, buildLandscape([]))).toBeNull();
    expect(criticCoverage(0)).toBe("0 of 10 outlets");
    expect(cardCountLine(4, 8)).toBe("Critics 4 of 10 outlets · Audience 8 evals");
    expect(pairedSampleNote(paired.critics, paired.audience)).toBe(
      "Critics 4 of 10 outlets. Audience based on 4 evals.",
    );
  });

  it("reports a dimension split only when both populations have a reading", () => {
    const judgments = (stance: "POSITIVE" | "NEGATIVE", population: "CRITIC" | "AUDIENCE"): PopulatedEvaluation => ({
      ...evaluation({
        judgments: [{ dimensionSlug: "performance", dimensionName: "Performance", stance }],
      }),
      population,
    });
    const paired = splitLandscapes([
      judgments("POSITIVE", "CRITIC"),
      judgments("POSITIVE", "CRITIC"),
      judgments("POSITIVE", "CRITIC"),
      judgments("POSITIVE", "CRITIC"),
      judgments("NEGATIVE", "AUDIENCE"),
      judgments("NEGATIVE", "AUDIENCE"),
      judgments("NEGATIVE", "AUDIENCE"),
      judgments("NEGATIVE", "AUDIENCE"),
    ]);
    expect(crossPopulationNotes(paired.critics, paired.audience).disagreement).toEqual([
      "Critics and audience split on performance.",
    ]);
    expect(crossPopulationNotes(paired.critics, buildLandscape([])).disagreement).toEqual([]);
  });

  it("withholds pattern language below the sample threshold", () => {
    const landscape = buildLandscape([
      evaluation({ enjoyment: "POSITIVE", execution: "NEGATIVE" }),
      evaluation({ enjoyment: "POSITIVE", execution: "NEGATIVE" }),
    ]);
    expect(landscape.agreement).toEqual([]);
    expect(landscape.disagreement).toEqual([]);
    expect(enjoymentExecutionGap(landscape)).toBeNull();
  });
});

describe("dimension shape reading", () => {
  it("keeps enjoyment, execution, and a dimension split in view", () => {
    const art = { dimensionSlug: "art-direction", dimensionName: "Art direction", stance: "POSITIVE" as const, sortOrder: 4 };
    const audience = buildLandscape([
      ...Array.from({ length: 3 }, () =>
        evaluation({
          enjoyment: "POSITIVE",
          execution: "NEGATIVE",
          judgments: [art, { dimensionSlug: "technical-quality", dimensionName: "Technical quality", stance: "NEGATIVE", sortOrder: 5 }],
        }),
      ),
      evaluation({
        enjoyment: "POSITIVE",
        execution: "NEGATIVE",
        judgments: [art, { dimensionSlug: "technical-quality", dimensionName: "Technical quality", stance: "MIXED", sortOrder: 5 }],
      }),
    ]);
    const critics = buildLandscape([
      ...Array.from({ length: 2 }, () =>
        evaluation({
          enjoyment: "POSITIVE",
          execution: "NEGATIVE",
          judgments: [art, { dimensionSlug: "technical-quality", dimensionName: "Technical quality", stance: "MIXED", sortOrder: 5 }],
        }),
      ),
      ...Array.from({ length: 2 }, () =>
        evaluation({
          enjoyment: "MIXED",
          execution: "NEGATIVE",
          judgments: [art, { dimensionSlug: "technical-quality", dimensionName: "Technical quality", stance: "MIXED", sortOrder: 5 }],
        }),
      ),
    ]);

    expect(dimensionShapeReading(critics, audience, "both")).toBe(
      "Audience enjoyment is mostly positive, and execution is mostly negative. Critics are divided on enjoyment, and execution is mostly negative. Art direction is mostly positive in both groups. Technical quality is mostly negative for the audience and is mostly mixed for critics.",
    );
  });
});
