import { describe, expect, it } from "vitest";
import { snapshotPeriod } from "./present";

describe("snapshot period", () => {
  it("spans the earliest and latest evaluation months", () => {
    expect(
      snapshotPeriod([new Date("2026-10-02T00:00:00Z"), new Date("2026-03-15T00:00:00Z"), new Date("2026-06-01T00:00:00Z")]),
    ).toBe("March 2026 to October 2026");
  });

  it("collapses to one month and stays empty without evaluations", () => {
    expect(snapshotPeriod([new Date("2026-10-02T00:00:00Z"), new Date("2026-10-20T00:00:00Z")])).toBe("October 2026");
    expect(snapshotPeriod([])).toBeNull();
  });
});
