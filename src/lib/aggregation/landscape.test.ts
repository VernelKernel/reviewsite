import { describe, expect, it } from "vitest";
import {
  addStance,
  buildLandscape,
  cardCountLine,
  criticCoverage,
  crossPopulationNotes,
  distributionLabel,
  emptyDistribution,
  enjoymentExecutionGap,
  gapSentence,
  pairedDimensions,
  pairedSampleNote,
  shapePoints,
  shapeTone,
  summaryLines,
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

  it("states the sample size without a verdict", () => {
    expect(sampleNote(1)).toBe("Based on 1 eval.");
    expect(sampleNote(3)).toBe("Based on 3 evals.");
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

  it("keeps enjoyment dimensions out of the work shape", () => {
    const landscape = buildLandscape([
      evaluation({
        judgments: [
          { dimensionSlug: "gameplay", dimensionName: "Gameplay", stance: "POSITIVE", family: "WORK" },
          { dimensionSlug: "fun", dimensionName: "Fun", stance: "NEGATIVE", family: "ENJOYMENT", sortOrder: 2 },
          { dimensionSlug: "engagement", dimensionName: "Engagement", stance: "POSITIVE", family: "ENJOYMENT", sortOrder: 1 },
        ],
      }),
    ]);
    expect(landscape.dimensions.map((dimension) => dimension.slug)).toEqual(["gameplay"]);
    expect(landscape.enjoymentDimensions.map((dimension) => dimension.slug)).toEqual(["engagement", "fun"]);
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
    const withOutlets = splitLandscapes([
      { ...critic({ enjoyment: "POSITIVE", execution: "POSITIVE" }), outletName: "IGN" },
      { ...critic({ enjoyment: "POSITIVE", execution: "NEGATIVE" }), outletName: "Edge" },
      { ...critic({ enjoyment: "MIXED", execution: "MIXED" }), outletName: "Polygon" },
    ]);
    expect(withOutlets.critics.sampleSize).toBe(3);
    expect(withOutlets.critics.coverageCount).toBe(2);
    expect(criticCoverage(withOutlets.critics.coverageCount)).toBe("2 of 10 outlets");
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

describe("population shapes", () => {
  function judged(stance: "POSITIVE" | "MIXED" | "NEGATIVE", population: "CRITIC" | "AUDIENCE", slug = "story"): PopulatedEvaluation {
    return {
      ...evaluation(),
      population,
      judgments: [{ dimensionSlug: slug, dimensionName: slug, stance, sortOrder: slug === "story" ? 1 : 2 }],
    };
  }

  it("places each population only on the dimensions it judged, in dimension order", () => {
    const paired = splitLandscapes([
      judged("POSITIVE", "AUDIENCE", "music"),
      judged("MIXED", "AUDIENCE", "story"),
      judged("POSITIVE", "CRITIC", "story"),
    ]);
    const dimensions = pairedDimensions(paired.critics, paired.audience);
    expect(shapePoints(dimensions, "audience").map((point) => point.slug)).toEqual(["story", "music"]);
    expect(shapePoints(dimensions, "critics").map((point) => point.slug)).toEqual(["story"]);
    const story = shapePoints(dimensions, "audience")[0];
    expect(story.distance).toBe(0.08);
    expect(story.t).toBe(0.5);
  });

  it("reads small or split samples as divided", () => {
    expect(shapeTone({ positive: 3, mixed: 0, negative: 0, count: 3 })).toBe("divided");
    expect(shapeTone({ positive: 2, mixed: 2, negative: 0, count: 4 })).toBe("divided");
    expect(shapeTone({ positive: 3, mixed: 1, negative: 0, count: 4 })).toBe("positive");
  });

  it("describes the enjoyment and execution gap only from four evaluations", () => {
    const few = buildLandscape([evaluation(), evaluation({ execution: "NEGATIVE" })]);
    expect(gapSentence(few)).toBeNull();
    const ahead = buildLandscape([
      evaluation(),
      evaluation(),
      evaluation({ execution: "MIXED" }),
      evaluation({ execution: "NEGATIVE" }),
    ]);
    expect(gapSentence(ahead)).toBe("Positive enjoyment readings run 50 points ahead of execution.");
    const level = buildLandscape([evaluation(), evaluation(), evaluation(), evaluation()]);
    expect(gapSentence(level)).toBe("Positive readings of enjoyment and execution are within 5 points of each other.");
  });

  it("labels summary lines by population only when both speak", () => {
    const critics = buildLandscape([evaluation(), evaluation(), evaluation(), evaluation()]);
    const audience = buildLandscape([evaluation(), evaluation(), evaluation(), evaluation()]);
    expect(summaryLines(critics, audience, true, false).agreement[0]).not.toMatch(/^Critics: /);
    expect(summaryLines(critics, audience, true, true).agreement.some((line) => line.startsWith("Audience: "))).toBe(true);
  });
});
