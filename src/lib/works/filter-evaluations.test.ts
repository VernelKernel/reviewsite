import { describe, expect, it } from "vitest";
import { filterEvaluations } from "./filter-evaluations";

const evaluations = [
  { lens: "EXECUTION", standard: "ABSOLUTE", completion: "COMPLETED", platform: { slug: "pc" }, population: "AUDIENCE" },
  { lens: "EXPERIENCE", standard: "CONTEXTUAL", completion: "EARLY", platform: { slug: "switch" }, population: "CRITIC" },
  { lens: "EXECUTION", standard: "ABSOLUTE", completion: "COMPLETED", platform: null, population: "AUDIENCE" },
];

describe("evaluation filters", () => {
  it("filters by platform along with lens, standard, and completion", () => {
    expect(filterEvaluations(evaluations, { platform: "pc" })).toHaveLength(1);
    expect(filterEvaluations(evaluations, { lens: "EXECUTION", platform: "pc" })).toHaveLength(1);
    expect(filterEvaluations(evaluations, { standard: "ABSOLUTE", completion: "COMPLETED" })).toHaveLength(2);
    expect(filterEvaluations(evaluations, {})).toHaveLength(3);
    expect(filterEvaluations(evaluations, { population: "CRITIC" })).toHaveLength(1);
    expect(filterEvaluations(evaluations, { population: "AUDIENCE" })).toHaveLength(2);
  });
});
