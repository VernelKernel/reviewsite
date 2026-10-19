import { describe, expect, it } from "vitest";
import { clusterGap, clusterOuterRadius, nestGeometry } from "./nest-geometry";

describe("nest emblem", () => {
  it("uses the same gap as the four-diamond emblem", () => {
    for (const scale of [0.4, 1, 4]) {
      const geometry = nestGeometry(clusterOuterRadius(scale));
      const gap = (geometry.holeRadius - geometry.innerRadius) / Math.SQRT2;
      expect(gap).toBeCloseTo(clusterGap(scale), 6);
      expect(geometry.innerRadius).toBeGreaterThan(geometry.outerRadius * 0.5);
    }
  });
});
