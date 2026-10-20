import { describe, expect, it } from "vitest";
import { flattenSections, foldSections, readStoredSections, syncSectionBlocks } from "./sections";

describe("review sections", () => {
  it("joins the opening and written sections with a blank line", () => {
    expect(
      flattenSections([
        { body: "  I came for the story. " },
        { body: "" },
        { body: "The plot lost me." },
      ]),
    ).toBe("I came for the story.\n\nThe plot lost me.");
  });

  it("reads stored sections and keeps a written dimension that is no longer judged", () => {
    const sections = readStoredSections([
      { dimensionId: null, body: "Opening." },
      { dimensionId: "story", body: "This still decided it." },
      { dimensionId: "music", body: "   " },
      { body: 12 },
    ]);
    expect(sections).toEqual([
      { dimensionId: null, body: "Opening." },
      { dimensionId: "story", body: "This still decided it." },
    ]);
  });

  it("folds text for a dimension the matched work does not use into the opening", () => {
    const folded = foldSections(
      [
        { dimensionId: null, body: "I came for the story." },
        { dimensionId: "gameplay", body: "The combat loop is why I stayed." },
        { dimensionId: "story", body: "The plot lost me, and that decided it." },
      ],
      new Set(["story"]),
    );
    expect(folded).toEqual([
      { dimensionId: null, body: "I came for the story.\n\nThe combat loop is why I stayed." },
      { dimensionId: "story", body: "The plot lost me, and that decided it." },
    ]);
    expect(flattenSections(folded)).toBe(
      "I came for the story.\n\nThe combat loop is why I stayed.\n\nThe plot lost me, and that decided it.",
    );
  });

  it("keeps a written block after its dimension is cleared and appends a new one", () => {
    const next = syncSectionBlocks(
      [
        { dimensionId: "gameplay", body: "" },
        { dimensionId: "story", body: "This decided it." },
      ],
      ["story", "music"],
    );
    expect(next).toEqual([
      { dimensionId: "story", body: "This decided it." },
      { dimensionId: "music", body: "" },
    ]);
  });
});
