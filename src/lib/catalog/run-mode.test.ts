import { describe, expect, it } from "vitest";
import { initialAnchor } from "./dates";
import { catalogIsDryRun } from "./run-mode";

describe("catalog dry run", () => {
  it("stays dry when npm swallows --dry-run", () => {
    expect(catalogIsDryRun(["tsx", "prisma/catalog/run.ts"], { npm_config_dry_run: "true" })).toBe(true);
    expect(catalogIsDryRun(["tsx", "prisma/catalog/run.ts", "--dry-run"], {})).toBe(true);
    expect(catalogIsDryRun(["tsx", "prisma/catalog/run.ts"], { CATALOG_DRY_RUN: "1" })).toBe(true);
    expect(catalogIsDryRun(["tsx", "prisma/catalog/run.ts"], {})).toBe(false);
  });
});

describe("initial catalog anchor", () => {
  it("starts on the run date", () => {
    expect(initialAnchor("2026-10-05", 0)).toBe("2026-10-05");
  });
});
