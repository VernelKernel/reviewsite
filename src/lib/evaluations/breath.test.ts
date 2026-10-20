import { describe, expect, it } from "vitest";
import { BREATH_EXHALE_SECONDS, BREATH_INHALE_SECONDS, breathScale } from "./breath";

describe("color field breath", () => {
  it("starts on the still emblem and returns there after each breath", () => {
    const cycle = BREATH_INHALE_SECONDS + BREATH_EXHALE_SECONDS;
    expect(breathScale(0)).toBe(1);
    expect(breathScale(cycle)).toBeCloseTo(1, 5);
    expect(breathScale(cycle * 2)).toBeCloseTo(1, 5);
  });

  it("eases in, then eases back out 50% faster", () => {
    expect(BREATH_EXHALE_SECONDS).toBeCloseTo(BREATH_INHALE_SECONDS / 1.5, 5);
    const full = breathScale(BREATH_INHALE_SECONDS);
    expect(full).toBeGreaterThan(1);
    expect(breathScale(BREATH_INHALE_SECONDS / 2)).toBeGreaterThan(1);
    expect(breathScale(BREATH_INHALE_SECONDS / 2)).toBeLessThan(full);
    const midExhale = breathScale(BREATH_INHALE_SECONDS + BREATH_EXHALE_SECONDS / 2);
    expect(midExhale).toBeLessThan(full);
    expect(midExhale).toBeGreaterThan(1);
  });
});
