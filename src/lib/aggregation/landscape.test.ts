import { describe, expect, it } from "vitest";
import {
  addStance,
  buildLandscape,
  distributionLabel,
  emptyDistribution,
  enjoymentExecutionGap,
  stanceShareGaps,
  isAggregateEligible,
  percentages,
  sampleNote,
  type LandscapeEvaluation,
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
