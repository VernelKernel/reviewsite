import { describe, expect, it } from "vitest";
import { readJudgments } from "./judgments";

describe("stored judgments", () => {
  it("keeps mattered when a single review recorded it", () => {
    expect(
      readJudgments([
        { dimensionId: "fun", stance: "NEGATIVE", mattered: "A_LITTLE" },
        { dimensionId: "fun", stance: "POSITIVE", mattered: "MATTERS_A_LOT" },
      ]),
    ).toEqual([{ dimensionId: "fun", stance: "NEGATIVE", mattered: "A_LITTLE" }]);
  });

  it("leaves mattered empty for a judgment saved before the field existed", () => {
    expect(readJudgments([{ dimensionId: "story", stance: "POSITIVE" }])).toEqual([
      { dimensionId: "story", stance: "POSITIVE", mattered: null },
    ]);
  });
});
