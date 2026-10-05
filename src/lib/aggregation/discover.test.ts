import { describe, expect, it } from "vitest";
import { buildLandscape, type LandscapeEvaluation } from "./landscape";
import { evidenceShelves, type DiscoverWork } from "./discover";

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

function work(title: string, evaluations: LandscapeEvaluation[]): DiscoverWork {
  return {
    title,
    slug: title.toLowerCase(),
    workType: "GAME",
    landscape: buildLandscape(evaluations),
  };
}

describe("evidence shelves", () => {
  it("lists every wide gap in the set and leaves a steady work off the shelf", () => {
    const apart = evidenceShelves([
      work("Wide", [
        evaluation({ enjoyment: "POSITIVE", execution: "NEGATIVE" }),
        evaluation({ enjoyment: "POSITIVE", execution: "NEGATIVE" }),
        evaluation({ enjoyment: "POSITIVE", execution: "NEGATIVE" }),
        evaluation({ enjoyment: "POSITIVE", execution: "POSITIVE" }),
      ]),
      work("Wider", [
        evaluation({ enjoyment: "POSITIVE", execution: "NEGATIVE" }),
        evaluation({ enjoyment: "POSITIVE", execution: "NEGATIVE" }),
        evaluation({ enjoyment: "POSITIVE", execution: "NEGATIVE" }),
        evaluation({ enjoyment: "POSITIVE", execution: "NEGATIVE" }),
      ]),
      work("Steady", [
        evaluation(),
        evaluation(),
        evaluation(),
        evaluation(),
      ]),
      work("Early", [
        evaluation({ enjoyment: "POSITIVE", execution: "NEGATIVE" }),
        evaluation({ enjoyment: "POSITIVE", execution: "NEGATIVE" }),
        evaluation({ enjoyment: "POSITIVE", execution: "NEGATIVE" }),
      ]),
    ]).find((shelf) => shelf.id === "apart");

    expect(apart?.works.map((item) => item.title)).toEqual(["Wider", "Wide"]);
    expect(apart?.works[0]?.note).toMatch(/Enjoyment runs/);
    expect(apart?.works[0]?.note).toMatch(/Based on 4 evals/);
  });

  it("keeps a standards split on its own shelf", () => {
    const standards = evidenceShelves([
      work("Context", [
        evaluation({ standard: "ABSOLUTE", execution: "POSITIVE" }),
        evaluation({ standard: "ABSOLUTE", execution: "POSITIVE" }),
        evaluation({ standard: "CONTEXTUAL", execution: "NEGATIVE" }),
        evaluation({ standard: "CONTEXTUAL", execution: "NEGATIVE" }),
      ]),
    ]).find((shelf) => shelf.id === "standards");

    expect(standards?.works.map((item) => item.title)).toEqual(["Context"]);
    expect(standards?.works[0]?.note).toMatch(/adjusted their expectations/);
  });
});
