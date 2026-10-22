import { describe, expect, it } from "vitest";
import {
  calibrateInfluences,
  influenceDiagnosticText,
  maskSources,
  type InfluenceSample,
  type InfluenceWeights,
} from "./influence-field";

const CASES: InfluenceWeights[] = [
  { positive: 1, mixed: 0, negative: 0 },
  { positive: 0.86, mixed: 0, negative: 0.14 },
  { positive: 0.77, mixed: 0.23, negative: 0 },
  { positive: 0.5, mixed: 0.13, negative: 0.37 },
  { positive: 0.25, mixed: 0.38, negative: 0.37 },
  { positive: 0.33, mixed: 0.34, negative: 0.33 },
  { positive: 0, mixed: 1, negative: 0 },
  { positive: 0, mixed: 0, negative: 1 },
];

function nearest(samples: InfluenceSample[], x: number, y: number): number {
  let best = 0;
  let distance = Number.POSITIVE_INFINITY;
  for (let index = 0; index < samples.length; index += 1) {
    const next = (samples[index].x - x) ** 2 + (samples[index].y - y) ** 2;
    if (next < distance) {
      distance = next;
      best = index;
    }
  }
  return best;
}

describe("influence field", () => {
  it("matches each distribution on the diamond and on the ring", () => {
    const filled = maskSources(48, 0);
    const ring = maskSources(48, 0.75);
    for (const target of CASES) {
      for (const samples of [filled, ring]) {
        const { weights, diagnostic } = calibrateInfluences(samples, target);
        expect(diagnostic.converged).toBe(true);
        expect(diagnostic.maxError).toBeLessThan(0.001);
        expect(weights).toHaveLength(samples.length);
        for (const weight of weights) {
          expect(weight.positive + weight.mixed + weight.negative).toBeCloseTo(1, 8);
          if (target.positive === 0) expect(weight.positive).toBe(0);
          if (target.mixed === 0) expect(weight.mixed).toBe(0);
          if (target.negative === 0) expect(weight.negative).toBe(0);
        }
      }
    }
  });

  it("keeps a pure sentiment pure", () => {
    const samples = maskSources(24, 0);
    const positive = calibrateInfluences(samples, { positive: 1, mixed: 0, negative: 0 });
    const mixed = calibrateInfluences(samples, { positive: 0, mixed: 1, negative: 0 });
    const negative = calibrateInfluences(samples, { positive: 0, mixed: 0, negative: 1 });
    for (const weight of positive.weights) expect(weight).toEqual({ positive: 1, mixed: 0, negative: 0 });
    for (const weight of mixed.weights) expect(weight.mixed).toBe(1);
    for (const weight of negative.weights) expect(weight.negative).toBe(1);
  });

  it("places 14% negative at the lower tip and keeps mixed out", () => {
    const samples = maskSources(56, 0);
    const { weights } = calibrateInfluences(samples, { positive: 0.86, mixed: 0, negative: 0.14 });
    const top = weights[nearest(samples, 0, -0.9)];
    const side = weights[nearest(samples, 0.7, 0)];
    const bottom = weights[nearest(samples, 0, 0.9)];
    expect(top.mixed).toBe(0);
    expect(bottom.negative).toBeGreaterThan(side.negative);
    expect(side.negative).toBeGreaterThan(top.negative);
    expect(top.positive).toBeGreaterThan(0.9);
    expect(bottom.positive).toBeGreaterThan(0);
  });

  it("keeps green present when it is the smallest share", () => {
    const samples = maskSources(48, 0);
    const { weights, diagnostic } = calibrateInfluences(samples, { positive: 0.25, mixed: 0.38, negative: 0.37 });
    expect(diagnostic.achieved.positive).toBeGreaterThan(0.24);
    const top = weights[nearest(samples, 0, -0.85)];
    const bottom = weights[nearest(samples, 0, 0.9)];
    expect(top.positive).toBeGreaterThan(bottom.positive);
    expect(top.positive).toBeGreaterThan(0.2);
    expect(bottom.negative).toBeGreaterThan(top.negative);
  });

  it("changes smoothly and repeats exactly", () => {
    const samples = maskSources(36, 0);
    const target = { positive: 0.5, mixed: 0.13, negative: 0.37 };
    const first = calibrateInfluences(samples, target);
    const second = calibrateInfluences(samples, target);
    expect(first.diagnostic.iterations).toBe(second.diagnostic.iterations);
    expect(first.weights[10]).toEqual(second.weights[10]);
    let worst = 0;
    for (let index = 0; index < samples.length; index += 1) {
      const next = samples.findIndex(
        (sample, other) =>
          other > index && Math.abs(sample.x - samples[index].x) < 0.07 && Math.abs(sample.y - samples[index].y) < 0.07,
      );
      if (next < 0) continue;
      worst = Math.max(worst, Math.abs(first.weights[index].negative - first.weights[next].negative));
    }
    expect(worst).toBeLessThan(0.45);
    expect(influenceDiagnosticText(first.diagnostic)).toContain("Iterations");
    expect(influenceDiagnosticText(first.diagnostic)).toContain("50.0%");
  });
});
