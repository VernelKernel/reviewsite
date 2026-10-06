import { describe, expect, it } from "vitest";
import { dimensions, topics } from "../../../prisma/seed/catalog";
import { GAME_DIMENSION_SLUGS, OBSERVATION_TOPICS } from "./evaluation-fields";
import { interpretationPrompt, parseInterpretation } from "./interpret";

describe("review interpretation", () => {
  it("accepts a structured reading and drops unknown fields", () => {
    const reading = parseInterpretation({
      lens: "MIXED",
      standard: "CONTEXTUAL",
      standardNote: "They judged the early-access build.",
      enjoyment: "POSITIVE",
      execution: "MIXED",
      completion: "SUBSTANTIAL",
      judgments: [
        { dimension: "combat", stance: "POSITIVE" },
        { dimension: "gameplay", stance: "POSITIVE" },
        { dimension: "gameplay", stance: "NEGATIVE" },
      ],
      observations: [
        { topic: "combat", polarity: "PRAISE", content: "The fights stay readable." },
        { topic: "inventory", polarity: "CRITICISM", content: "The menus are slow." },
      ],
    });
    expect(reading?.judgments).toEqual([{ dimension: "gameplay", stance: "POSITIVE" }]);
    expect(reading?.observations).toEqual([{ topic: "combat", polarity: "PRAISE", content: "The fights stay readable." }]);
    expect(reading?.enjoyment).toBe("POSITIVE");
    expect(reading?.execution).toBe("MIXED");
  });

  it("rejects a reading that has no enjoyment", () => {
    expect(parseInterpretation({ lens: "EXPERIENCE", execution: "POSITIVE" })).toBeNull();
  });

  it("uses the same dimensions and topics as the seed catalog", () => {
    const gameDimensions = dimensions.filter((dimension) => dimension.appliesTo.includes("GAME")).map((dimension) => dimension.slug);
    expect([...GAME_DIMENSION_SLUGS]).toEqual(gameDimensions);
    expect([...OBSERVATION_TOPICS]).toEqual(topics.map(([slug]) => slug));
  });

  it("names the game and includes the review as evidence", () => {
    const prompt = interpretationPrompt({
      title: "Hades",
      body: "I finished a run and the combat sang.",
      votedUp: true,
      playtimeMinutes: 90,
      earlyAccess: false,
    });
    expect(prompt).toContain("Hades");
    expect(prompt).toContain("I finished a run and the combat sang.");
  });
});
