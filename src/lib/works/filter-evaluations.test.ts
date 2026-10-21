import { describe, expect, it } from "vitest";
import { filterEvaluations } from "./filter-evaluations";

const evaluations = [
  { completion: "COMPLETED", platform: { slug: "pc" }, population: "AUDIENCE" },
  { completion: "EARLY", platform: { slug: "switch" }, population: "CRITIC" },
  { completion: "COMPLETED", platform: null, population: "AUDIENCE" },
];

describe("evaluation filters", () => {
  it("filters by platform and completion", () => {
    expect(filterEvaluations(evaluations, { platform: "pc" })).toHaveLength(1);
    expect(filterEvaluations(evaluations, { completion: "COMPLETED" })).toHaveLength(2);
    expect(filterEvaluations(evaluations, {})).toHaveLength(3);
    expect(filterEvaluations(evaluations, { population: "CRITIC" })).toHaveLength(1);
    expect(filterEvaluations(evaluations, { population: "AUDIENCE" })).toHaveLength(2);
  });
});
