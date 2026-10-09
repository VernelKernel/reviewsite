import { describe, expect, it } from "vitest";
import { normalizeTitle, trigramSimilarity } from "./normalize";

describe("normalizeTitle", () => {
  it("folds case, punctuation, a leading article, edition noise, and a year", () => {
    expect(normalizeTitle("Ace Combat 8: Wings of Theve")).toBe("ace combat 8 wings of theve");
    expect(normalizeTitle("The Hades GOTY (2020)")).toBe("hades");
    expect(normalizeTitle("A Remastered Tale")).toBe("tale");
  });

  it("keeps articles that are not at the start", () => {
    expect(normalizeTitle("Legend of the Zelda")).toBe("legend of the zelda");
  });
});

describe("trigramSimilarity", () => {
  it("scores an exact string above a distant one", () => {
    const exact = trigramSimilarity("hades", "hades");
    const distant = trigramSimilarity("hades", "control");
    expect(exact).toBe(1);
    expect(distant).toBeLessThan(exact);
  });
});
