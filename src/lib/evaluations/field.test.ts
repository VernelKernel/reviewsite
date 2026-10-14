import { describe, expect, it } from "vitest";
import { canCloseField, centerStance, fieldModel, illuminatedFieldColor, sampleFieldColor, type RGB } from "./field";
import type { StanceName } from "./radar";

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
});
