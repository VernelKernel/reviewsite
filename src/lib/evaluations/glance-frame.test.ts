import { describe, expect, it } from "vitest";
import { GLANCE_HEIGHT, GLANCE_RADIUS, GLANCE_WIDTH, glanceMaxSpan } from "./glance-frame";

describe("glance hit box", () => {
  it("covers a shape whose vertices sit on the outer ring", () => {
    const span = glanceMaxSpan();
    expect(span.width).toBe((GLANCE_RADIUS * 2) / GLANCE_WIDTH);
    expect(span.height).toBe((GLANCE_RADIUS * 2) / GLANCE_HEIGHT);
    expect(span.width).toBeLessThan(1);
    expect(span.height).toBeLessThan(1);
    expect(span.width * GLANCE_WIDTH).toBe(span.height * GLANCE_HEIGHT);
  });
});
