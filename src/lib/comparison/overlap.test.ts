import { describe, expect, it } from "vitest";
import { compareReviewers, type OverlapEvaluation } from "./overlap";

function evaluation(overrides: Partial<OverlapEvaluation> = {}): OverlapEvaluation {
  return {
    reviewerId: "you",
    workId: "hades",
    title: "Hades",
    workType: "GAME",
    workSlug: "hades",
    reviewerSlug: "you",
    enjoyment: "POSITIVE",
    execution: "POSITIVE",
    lens: "EXPERIENCE",
    standard: "ABSOLUTE",
    judgments: [],
    ...overrides,
  };
}

describe("reviewer overlap", () => {
  it("sorts shared works from works only one person evaluated", () => {
    const overlap = compareReviewers(
      [
        evaluation({ workId: "hades", title: "Hades" }),
        evaluation({ workId: "celeste", title: "Celeste", enjoyment: "NEGATIVE", execution: "MIXED" }),
      ],
      [
        evaluation({
          reviewerId: "maya",
          reviewerSlug: "maya",
          workId: "hades",
          title: "Hades",
          enjoyment: "POSITIVE",
          execution: "NEGATIVE",
          judgments: [{ slug: "story", name: "Story", stance: "POSITIVE" }],
        }),
        evaluation({ reviewerId: "maya", reviewerSlug: "maya", workId: "disco", title: "Disco Elysium" }),
      ],
    );
    expect(overlap.shared.map((row) => row.title)).toEqual(["Hades"]);
    expect(overlap.onlyYou.map((row) => row.title)).toEqual(["Celeste"]);
    expect(overlap.onlyThem.map((row) => row.title)).toEqual(["Disco Elysium"]);
    expect(overlap.summary).toBe("1 work in common. Enjoyment matches on 1. Execution matches on 0.");
    expect(overlap.shared[0]?.enjoymentLine).toBe("Enjoyment matches.");
    expect(overlap.shared[0]?.executionLine).toBe("Execution differs: you are positive, they are negative.");
  });

  it("names dimension gaps and skips unjudged dimensions", () => {
    const overlap = compareReviewers(
      [
        evaluation({
          judgments: [
            { slug: "story", name: "Story", stance: "NEGATIVE" },
            { slug: "music", name: "Music", stance: "POSITIVE" },
          ],
        }),
      ],
      [
        evaluation({
          reviewerId: "maya",
          reviewerSlug: "maya",
          judgments: [
            { slug: "story", name: "Story", stance: "POSITIVE" },
            { slug: "controls", name: "Controls", stance: "NEGATIVE" },
          ],
        }),
      ],
    );
    expect(overlap.shared[0]?.dimensionLines).toEqual(["Story: you are negative, they are positive."]);
    expect(overlap.summary).toBe("1 work in common. Enjoyment matches on 1. Execution matches on 1.");
  });

  it("counts enjoyment and execution separately across several works", () => {
    const overlap = compareReviewers(
      [
        evaluation({ workId: "a", title: "A", enjoyment: "POSITIVE", execution: "NEGATIVE" }),
        evaluation({ workId: "b", title: "B", enjoyment: "MIXED", execution: "POSITIVE" }),
      ],
      [
        evaluation({ reviewerId: "maya", reviewerSlug: "maya", workId: "a", title: "A", enjoyment: "POSITIVE", execution: "NEGATIVE" }),
        evaluation({ reviewerId: "maya", reviewerSlug: "maya", workId: "b", title: "B", enjoyment: "NEGATIVE", execution: "POSITIVE" }),
      ],
    );
    expect(overlap.summary).toBe("2 works in common. Enjoyment matches on 1. Execution matches on 2.");
  });

  it("filters to a shared standard before counting", () => {
    const overlap = compareReviewers(
      [
        evaluation({ workId: "a", title: "A", standard: "ABSOLUTE" }),
        evaluation({ workId: "b", title: "B", standard: "CONTEXTUAL" }),
      ],
      [
        evaluation({ reviewerId: "maya", reviewerSlug: "maya", workId: "a", title: "A", standard: "ABSOLUTE" }),
        evaluation({ reviewerId: "maya", reviewerSlug: "maya", workId: "b", title: "B", standard: "ABSOLUTE" }),
      ],
      { standard: "CONTEXTUAL" },
    );
    expect(overlap.shared).toEqual([]);
    expect(overlap.onlyYou.map((row) => row.workId)).toEqual(["b"]);
    expect(overlap.onlyThem).toEqual([]);
    expect(overlap.summary).toBe("No works in common.");
  });
});
