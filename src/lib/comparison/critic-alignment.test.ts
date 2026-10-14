import { describe, expect, it } from "vitest";
import { alignCritics, type CriticEvaluation } from "./critic-alignment";

function critic(overrides: Partial<CriticEvaluation> = {}): CriticEvaluation {
  return {
    outlet: "IGN",
    reviewerName: "IGN",
    enjoyment: "POSITIVE",
    execution: "NEGATIVE",
    judgments: [],
    ...overrides,
  };
}

const viewer = {
  enjoyment: "NEGATIVE" as const,
  execution: "POSITIVE" as const,
  judgments: [
    { slug: "story", name: "Story", stance: "NEGATIVE" as const },
    { slug: "music", name: "Music", stance: "POSITIVE" as const },
  ],
};

describe("critic alignment", () => {
  it("splits outlets by the selected metric only", () => {
    const metrics = alignCritics(viewer, [
      critic({ outlet: "Polygon", enjoyment: "NEGATIVE", execution: "POSITIVE" }),
      critic({ outlet: "IGN", enjoyment: "POSITIVE", execution: "NEGATIVE" }),
      critic({ outlet: "GameSpot", enjoyment: "MIXED", execution: "POSITIVE" }),
    ]);
    const enjoyment = metrics.find((metric) => metric.key === "enjoyment");
    const execution = metrics.find((metric) => metric.key === "execution");
    expect(enjoyment?.aligned).toEqual(["Polygon"]);
    expect(enjoyment?.apart).toEqual([
      { outlet: "GameSpot", stance: "MIXED" },
      { outlet: "IGN", stance: "POSITIVE" },
    ]);
    expect(enjoyment?.sentence).toBe("Your enjoyment is negative. Of 3 outlets, 1 is positive, 1 is mixed, and 1 is negative.");
    expect(execution?.aligned).toEqual(["GameSpot", "Polygon"]);
    expect(execution?.apart).toEqual([{ outlet: "IGN", stance: "NEGATIVE" }]);
    expect(execution?.others.positive).toBe(2);
    expect(enjoyment?.others.positive).toBe(1);
  });

  it("does not offer a dimension the viewer did not judge", () => {
    const metrics = alignCritics(
      { ...viewer, judgments: [{ slug: "story", name: "Story", stance: "NEGATIVE" }] },
      [critic({ judgments: [{ slug: "music", name: "Music", stance: "POSITIVE" }] })],
    );
    expect(metrics.map((metric) => metric.key)).toEqual(["enjoyment", "execution"]);
  });

  it("omits an outlet that skipped the dimension", () => {
    const metrics = alignCritics(viewer, [
      critic({
        outlet: "Polygon",
        judgments: [{ slug: "story", name: "Story", stance: "NEGATIVE" }],
      }),
      critic({
        outlet: "IGN",
        judgments: [{ slug: "story", name: "Story", stance: "POSITIVE" }],
      }),
      critic({ outlet: "Eurogamer", judgments: [] }),
      critic({ outlet: "Kotaku", judgments: [{ slug: "music", name: "Music", stance: "NEGATIVE" }] }),
    ]);
    const story = metrics.find((metric) => metric.key === "dimension:story");
    expect(story?.aligned).toEqual(["Polygon"]);
    expect(story?.apart).toEqual([{ outlet: "IGN", stance: "POSITIVE" }]);
    expect(story?.omittedCount).toBe(2);
    expect(story?.omittedSentence).toBe("2 outlets did not judge story.");
    expect(story?.sentence).toBe("Your story is negative. Of 2 outlets that judged story, 1 is positive and 1 is negative.");
    expect(metrics.some((metric) => metric.key === "dimension:music")).toBe(true);
  });

  it("does not offer a dimension no outlet judged", () => {
    const metrics = alignCritics(viewer, [critic({ judgments: [] })]);
    expect(metrics.map((metric) => metric.key)).toEqual(["enjoyment", "execution"]);
  });
});
