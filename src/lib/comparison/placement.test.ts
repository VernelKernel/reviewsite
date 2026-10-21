import { describe, expect, it } from "vitest";
import { placeAudience, type PlacementEvaluation } from "./placement";

function row(overrides: Partial<PlacementEvaluation> = {}): PlacementEvaluation {
  return {
    reviewerId: "other",
    enjoyment: "POSITIVE",
    execution: "POSITIVE",
    judgments: [],
    ...overrides,
  };
}

const viewer = row({
  reviewerId: "you",
  enjoyment: "POSITIVE",
  execution: "MIXED",
  judgments: [{ slug: "story", name: "Story", stance: "NEGATIVE" }],
});

describe("audience placement", () => {
  it("leaves the viewer out of the counts", () => {
    const placement = placeAudience(viewer, [
      viewer,
      row({ reviewerId: "a", enjoyment: "NEGATIVE" }),
      row({ reviewerId: "b", enjoyment: "NEGATIVE" }),
    ]);
    const enjoyment = placement.lines.find((line) => line.key === "enjoyment");
    expect(enjoyment?.others.count).toBe(2);
    expect(enjoyment?.others.negative).toBe(2);
    expect(enjoyment?.sentence).toBe("Your enjoyment is positive. Of 2 other published audience evaluations, 2 are negative.");
  });

  it("keeps a small sample as a count", () => {
    const placement = placeAudience(viewer, [row({ reviewerId: "a", enjoyment: "MIXED", execution: "POSITIVE" })]);
    expect(placement.lines[0]?.sentence).toBe("Your enjoyment is positive. The other published audience evaluation is mixed.");
    expect(placement.lines[1]?.sentence).toBe("Your execution is mixed. The other published audience evaluation is positive.");
  });

  it("describes a divided set and a dominant set with counts", () => {
    const placement = placeAudience(viewer, [
      row({ enjoyment: "POSITIVE", execution: "POSITIVE", reviewerId: "a" }),
      row({ enjoyment: "POSITIVE", execution: "NEGATIVE", reviewerId: "b" }),
      row({ enjoyment: "NEGATIVE", execution: "POSITIVE", reviewerId: "c" }),
      row({ enjoyment: "NEGATIVE", execution: "POSITIVE", reviewerId: "d" }),
    ]);
    expect(placement.lines[0]?.sentence).toBe(
      "Your enjoyment is positive. Of 4 other published audience evaluations, 2 are positive and 2 are negative. That set is divided.",
    );
    expect(placement.lines[1]?.sentence).toBe(
      "Your execution is mixed. Of 4 other published audience evaluations, 3 are positive and 1 is negative.",
    );
  });

  it("skips dimensions the viewer did not judge", () => {
    const placement = placeAudience(
      row({ reviewerId: "you", judgments: [] }),
      [row({ reviewerId: "a", judgments: [{ slug: "music", name: "Music", stance: "POSITIVE" }] })],
    );
    expect(placement.lines.map((line) => line.key)).toEqual(["enjoyment", "execution"]);
  });

  it("counts only other people who judged that dimension", () => {
    const placement = placeAudience(viewer, [
      row({ reviewerId: "a", judgments: [{ slug: "story", name: "Story", stance: "POSITIVE" }] }),
      row({ reviewerId: "b", judgments: [{ slug: "music", name: "Music", stance: "POSITIVE" }] }),
    ]);
    const story = placement.lines.find((line) => line.key === "story");
    expect(story?.sentence).toBe("You call story negative. The other evaluation that judged story is positive.");
  });

  it("says when the set is empty", () => {
    const placement = placeAudience(viewer, [viewer]);
    expect(placement.lines[0]?.sentence).toBe("Your enjoyment is positive. No other published audience evaluations are in this set.");
  });
});
