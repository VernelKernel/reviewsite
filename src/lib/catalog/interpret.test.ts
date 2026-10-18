import { describe, expect, it } from "vitest";
import { dimensions, topics } from "../../../prisma/seed/catalog";
import { GAME_DIMENSION_SLUGS, GAME_ENJOYMENT_DIMENSIONS, GAME_ENJOYMENT_SLUGS, OBSERVATION_TOPICS } from "./evaluation-fields";
import {
  criticInterpretationPrompt,
  criticPlatformPrompt,
  interpretationPrompt,
  parseCriticInterpretation,
  parseCriticPlatform,
  parseInterpretation,
  reviewPlatformSlug,
} from "./interpret";

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
    expect(reading?.impression).toBeNull();
  });

  it("keeps a short impression and drops a stub", () => {
    const full = "The fights land. The missions repeat themselves before the campaign finds another idea worth chasing tonight.";
    const reading = parseInterpretation({
      lens: "EXECUTION",
      standard: "ABSOLUTE",
      enjoyment: "MIXED",
      execution: "MIXED",
      completion: "COMPLETED",
      impression: full,
    });
    expect(reading?.impression).toBe(full.slice(0, 80));
    const empty = parseInterpretation({
      lens: "EXECUTION",
      standard: "ABSOLUTE",
      enjoyment: "POSITIVE",
      execution: "POSITIVE",
      completion: "COMPLETED",
      impression: "Good.",
    });
    expect(empty?.impression).toBeNull();
    const prompt = interpretationPrompt({ title: "Ace", body: "The missions repeat.", votedUp: true, playtimeMinutes: 600, earlyAccess: false });
    expect(prompt).toContain("at most 80 characters");
    expect(prompt).toContain("Do not invent");
  });

  it("leaves an unstated critic approach unset", () => {
    const reading = parseCriticInterpretation({
      enjoyment: "NEGATIVE",
      execution: "MIXED",
      judgments: [{ dimension: "technical-quality", stance: "NEGATIVE" }],
    });
    expect(reading?.lens).toBeNull();
    expect(reading?.standard).toBeNull();
    expect(reading?.completion).toBe("UNKNOWN");
    expect(reading?.platform).toBeNull();
    expect(reading?.judgments).toEqual([{ dimension: "technical-quality", stance: "NEGATIVE" }]);
    const prompt = criticInterpretationPrompt({ title: "Alkurai", outlet: "IGN", body: "The port stutters." });
    expect(prompt).toContain("Leave lens empty");
    expect(prompt).toContain("Leave platform empty");
  });

  it("keeps the platform the critic played and ignores a version list", () => {
    expect(reviewPlatformSlug("PS5")).toBe("playstation-5");
    expect(reviewPlatformSlug("PlayStation 5")).toBe("playstation-5");
    expect(reviewPlatformSlug("Xbox Series X")).toBe("xbox-series");
    expect(reviewPlatformSlug("Nintendo Switch")).toBe("switch");
    expect(reviewPlatformSlug("PlayStation")).toBeNull();
    expect(reviewPlatformSlug("every platform")).toBeNull();
    const reading = parseCriticInterpretation({
      enjoyment: "POSITIVE",
      execution: "POSITIVE",
      platform: "PS5",
    });
    expect(reading?.platform).toBe("playstation-5");
    expect(parseCriticPlatform({ platform: "Nintendo Switch" })).toBe("switch");
    expect(parseCriticPlatform({ platform: "" })).toBeNull();
    expect(criticPlatformPrompt({ title: "Alkurai", outlet: "IGN", body: "Played on PS5." })).toContain("Leave platform empty");
  });

  it("rejects a reading that has no enjoyment", () => {
    expect(parseInterpretation({ lens: "EXPERIENCE", execution: "POSITIVE" })).toBeNull();
  });

  it("keeps enjoyment dimensions when the review answers them", () => {
    const reading = parseInterpretation({
      lens: "EXPERIENCE",
      standard: "ABSOLUTE",
      enjoyment: "POSITIVE",
      execution: "MIXED",
      completion: "COMPLETED",
      enjoymentJudgments: [
        { dimension: "engagement", stance: "POSITIVE" },
        { dimension: "pacing", stance: "NEGATIVE" },
        { dimension: "replay-appeal", stance: "MIXED" },
        { dimension: "engagement", stance: "NEGATIVE" },
      ],
      judgments: [
        { dimension: "gameplay", stance: "MIXED" },
        { dimension: "fun", stance: "POSITIVE" },
      ],
    });
    expect(reading?.judgments).toEqual([
      { dimension: "engagement", stance: "POSITIVE" },
      { dimension: "replay-appeal", stance: "MIXED" },
      { dimension: "gameplay", stance: "MIXED" },
      { dimension: "fun", stance: "POSITIVE" },
    ]);
  });

  it("asks for enjoyment dimensions before work dimensions", () => {
    const steam = interpretationPrompt({ title: "Hades", body: "I would play it again.", votedUp: true, playtimeMinutes: 600, earlyAccess: false });
    const critic = criticInterpretationPrompt({ title: "Hades", outlet: "IGN", body: "I would play it again." });
    for (const prompt of [steam, critic]) {
      expect(prompt.indexOf("enjoymentJudgments come first")).toBeLessThan(prompt.indexOf("judgments: work dimensions only"));
      expect(prompt).toContain("Did it hold your attention?");
      expect(prompt).toContain("Do not copy the headline enjoyment");
      expect(prompt).toContain("engagement, fun, immersion, emotional-impact, replay-appeal, satisfaction");
    }
  });

  it("uses the same dimensions and topics as the seed catalog", () => {
    const gameDimensions = dimensions
      .filter((dimension) => dimension.appliesTo.includes("GAME") && dimension.family !== "ENJOYMENT")
      .map((dimension) => dimension.slug);
    expect([...GAME_DIMENSION_SLUGS]).toEqual(gameDimensions);
    const enjoyment = dimensions
      .filter((dimension) => dimension.family === "ENJOYMENT" && dimension.appliesTo.includes("GAME"))
      .sort((left, right) => left.sortOrder - right.sortOrder);
    expect([...GAME_ENJOYMENT_SLUGS]).toEqual(enjoyment.map((dimension) => dimension.slug));
    expect(GAME_ENJOYMENT_DIMENSIONS.map((dimension) => dimension.question)).toEqual(enjoyment.map((dimension) => dimension.description));
    expect([...OBSERVATION_TOPICS]).toEqual(topics.map(([slug]) => slug));
  });

  it("keeps enjoyment dimensions in experience order for each work type", () => {
    const slugs = (workType: "GAME" | "MOVIE") =>
      dimensions
        .filter((dimension) => dimension.family === "ENJOYMENT" && dimension.appliesTo.includes(workType))
        .sort((left, right) => left.sortOrder - right.sortOrder)
        .map((dimension) => dimension.slug);
    expect(slugs("GAME")).toEqual(["engagement", "fun", "immersion", "emotional-impact", "replay-appeal", "satisfaction"]);
    expect(slugs("MOVIE")).toEqual(["engagement", "pacing", "immersion", "investment", "emotional-impact", "resonance"]);
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
