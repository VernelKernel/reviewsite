import { describe, expect, it } from "vitest";
import { canCloseField, centerStance, fieldModel, fieldModelFrom, illuminatedFieldColor, sampleFieldColor, type RGB } from "./field";
import type { StanceName } from "./radar";
import { MATTERED_RADIUS } from "./mattered";

const palette = {
  positive: "#1F7A4D",
  mixed: "#E7B008",
  negative: "#E15A4A",
};

const layout = { cx: 200, cy: 200, radius: 100 };

function axes(stances: StanceName[]) {
  return stances.map((stance) => ({ stance }));
}

function model(stances: StanceName[]) {
  return fieldModel(axes(stances), layout.cx, layout.cy, layout.radius, palette);
}

function at(stances: StanceName[], x: number, y: number): RGB {
  const reading = model(stances);
  if (!reading) throw new Error("expected a closed field");
  const color = sampleFieldColor(reading, x, y);
  if (!color) throw new Error(`expected color at ${x},${y}`);
  return color;
}

function nearVertex(stances: StanceName[], index: number): RGB {
  const count = stances.length;
  const angle = -Math.PI / 2 + (index * 2 * Math.PI) / count;
  const distance = stances[index] === "POSITIVE" ? 78 : stances[index] === "MIXED" ? 48 : 26;
  return at(stances, layout.cx + Math.cos(angle) * distance, layout.cy + Math.sin(angle) * distance);
}

function green(color: RGB) {
  return color.g > color.r + 12 && color.g > color.b + 12;
}

function red(color: RGB) {
  return color.r > color.g + 12 && color.r > color.b + 8;
}

function yellow(color: RGB) {
  return color.r > 230 && color.g > 210 && color.b < 80;
}

function amber(color: RGB) {
  return color.r > 150 && color.g > 110 && color.b < color.g - 15 && color.r + 20 > color.g;
}

describe("evaluation field", () => {
  it("keeps an all-positive field green, including the center", () => {
    const center = at(["POSITIVE", "POSITIVE", "POSITIVE", "POSITIVE"], layout.cx, layout.cy);
    expect(green(center)).toBe(true);
    expect(red(center)).toBe(false);
    expect(green(nearVertex(["POSITIVE", "POSITIVE", "POSITIVE", "POSITIVE"], 2))).toBe(true);
  });

  it("keeps an all-mixed field amber", () => {
    expect(amber(at(["MIXED", "MIXED", "MIXED", "MIXED"], layout.cx, layout.cy))).toBe(true);
  });

  it("keeps an all-negative field red", () => {
    expect(red(at(["NEGATIVE", "NEGATIVE", "NEGATIVE", "NEGATIVE"], layout.cx, layout.cy))).toBe(true);
  });

  it("localizes one mixed judgment inside a positive field", () => {
    const stances: StanceName[] = ["POSITIVE", "POSITIVE", "MIXED", "POSITIVE"];
    const mixed = nearVertex(stances, 2);
    const positive = nearVertex(stances, 0);
    expect(green(positive)).toBe(true);
    expect(mixed.r - mixed.g).toBeGreaterThan(positive.r - positive.g);
  });

  it("localizes one negative judgment without turning the field red", () => {
    const stances: StanceName[] = ["POSITIVE", "POSITIVE", "NEGATIVE", "POSITIVE"];
    expect(green(nearVertex(stances, 0))).toBe(true);
    expect(red(nearVertex(stances, 2))).toBe(true);
    expect(green(at(stances, layout.cx, layout.cy - 20))).toBe(true);
  });

  it("keeps two positive and two negative regions distinct", () => {
    const stances: StanceName[] = ["POSITIVE", "NEGATIVE", "POSITIVE", "NEGATIVE"];
    expect(green(nearVertex(stances, 0))).toBe(true);
    expect(red(nearVertex(stances, 1))).toBe(true);
  });

  it("does not invent a color for unjudged dimensions", () => {
    expect(canCloseField(2)).toBe(false);
    expect(model(["POSITIVE"])).toBeNull();
    expect(centerStance(["POSITIVE", "POSITIVE", "POSITIVE"])).toBe(1);
  });

  it("repeats the same color for the same evaluation", () => {
    const first = at(["POSITIVE", "MIXED", "NEGATIVE", "POSITIVE"], 180, 170);
    const second = at(["POSITIVE", "MIXED", "NEGATIVE", "POSITIVE"], 180, 170);
    expect(second).toEqual(first);
    expect(centerStance(["NEGATIVE", "POSITIVE"])).toBe(centerStance(["POSITIVE", "NEGATIVE"]));
  });

  it("varies luminance inside a stance without changing that stance", () => {
    const reading = model(["POSITIVE", "POSITIVE", "POSITIVE", "POSITIVE"]);
    if (!reading) throw new Error("expected a closed field");
    const upper = illuminatedFieldColor(reading, layout.cx, layout.cy - 36);
    const lower = illuminatedFieldColor(reading, layout.cx, layout.cy + 36);
    if (!upper || !lower) throw new Error("expected illuminated color");
    expect(green(upper)).toBe(true);
    expect(green(lower)).toBe(true);
    expect(upper).not.toEqual(lower);
    expect(illuminatedFieldColor(reading, layout.cx, layout.cy - 36)).toEqual(upper);
    const mixed = model(["POSITIVE", "POSITIVE", "MIXED", "POSITIVE"]);
    if (!mixed) throw new Error("expected a closed field");
    const warm = illuminatedFieldColor(mixed, layout.cx, layout.cy + 48);
    const cool = illuminatedFieldColor(mixed, layout.cx, layout.cy - 48);
    if (!warm || !cool) throw new Error("expected illuminated color");
    expect(warm.r - warm.g).toBeGreaterThan(cool.r - cool.g);
  });

  it("keeps a strong negative at the rim, and paints the center from the vertices", () => {
    const negative = fieldModelFrom(
      [
        { distance: 1, t: 0 },
        { distance: 1, t: 0 },
        { distance: 1, t: 0 },
      ],
      layout.cx,
      layout.cy,
      layout.radius,
      palette,
    );
    const mixed = fieldModelFrom(
      [
        { distance: 1, t: 0.5 },
        { distance: 1, t: 0.5 },
        { distance: 1, t: 0.5 },
      ],
      layout.cx,
      layout.cy,
      layout.radius,
      palette,
    );
    const spread = fieldModelFrom(
      [
        { distance: 1, t: 1 },
        { distance: 1, t: 0 },
        { distance: 1, t: 0.5 },
      ],
      layout.cx,
      layout.cy,
      layout.radius,
      palette,
    );
    if (!negative || !mixed || !spread) throw new Error("expected a closed field");
    const rim = sampleFieldColor(negative, layout.cx, layout.cy - 90);
    const negativeCenter = sampleFieldColor(negative, layout.cx, layout.cy);
    const mixedCenter = sampleFieldColor(mixed, layout.cx, layout.cy);
    const spreadCenter = sampleFieldColor(spread, layout.cx, layout.cy);
    const positiveRim = sampleFieldColor(spread, layout.cx, layout.cy - 90);
    if (!rim || !negativeCenter || !mixedCenter || !spreadCenter || !positiveRim) throw new Error("expected color");
    expect(red(rim)).toBe(true);
    expect(red(negativeCenter)).toBe(true);
    expect(amber(mixedCenter)).toBe(true);
    expect(amber(spreadCenter)).toBe(true);
    expect(spreadCenter.r - spreadCenter.g).toBeLessThan(negativeCenter.r - negativeCenter.g);
    expect(green(positiveRim)).toBe(true);
  });

  it("places a single-review point on the mattered ring and keeps stance in the color", () => {
    const reading = fieldModel(
      [
        { stance: "NEGATIVE", mattered: "MATTERS_A_LOT" },
        { stance: "NEGATIVE", mattered: "QUITE_A_BIT" },
        { stance: "NEGATIVE", mattered: "A_LITTLE" },
      ],
      layout.cx,
      layout.cy,
      layout.radius,
      palette,
    );
    if (!reading) throw new Error("expected a closed field");
    const distance = (index: number) => Math.hypot(reading.vertices[index].x - layout.cx, reading.vertices[index].y - layout.cy);
    expect(distance(0)).toBeCloseTo(layout.radius * MATTERED_RADIUS.MATTERS_A_LOT, 5);
    expect(distance(1)).toBeCloseTo(layout.radius * MATTERED_RADIUS.QUITE_A_BIT, 5);
    expect(distance(2)).toBeCloseTo(layout.radius * MATTERED_RADIUS.A_LITTLE, 5);
    const outer = sampleFieldColor(reading, reading.vertices[0].x, reading.vertices[0].y);
    if (!outer) throw new Error("expected color");
    expect(red(outer)).toBe(true);
  });

  it("paints a tied vertex yellow instead of mixed", () => {
    const tied = fieldModelFrom(
      [
        { distance: 0.5, t: 0.5, divided: true },
        { distance: 1, t: 0.5 },
        { distance: 1, t: 0.5 },
      ],
      layout.cx,
      layout.cy,
      layout.radius,
      { ...palette, divided: "#FFF200" },
    );
    if (!tied) throw new Error("expected a closed field");
    const split = sampleFieldColor(tied, layout.cx, layout.cy - 46);
    const mixedRim = sampleFieldColor(tied, layout.cx + Math.cos(Math.PI / 6) * 90, layout.cy + Math.sin(Math.PI / 6) * 90);
    if (!split || !mixedRim) throw new Error("expected color");
    const painted = illuminatedFieldColor(tied, layout.cx, layout.cy - 46);
    if (!painted) throw new Error("expected a painted color");
    expect(yellow(split)).toBe(true);
    expect(yellow(painted)).toBe(true);
    expect(yellow(mixedRim)).toBe(false);
    expect(amber(mixedRim)).toBe(true);
  });
});
