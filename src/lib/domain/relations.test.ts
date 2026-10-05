import { describe, expect, it } from "vitest";
import { assertValidWorkRelation, DomainError, relationPhrase } from "./relations";

describe("work relations", () => {
  it("rejects a self relation", () => {
    expect(() => assertValidWorkRelation("hades", "hades")).toThrow(DomainError);
  });

  it("reads a sequel from both directions without a second stored fact", () => {
    expect(relationPhrase("outgoing", "SEQUEL")).toBe("Sequel of");
    expect(relationPhrase("incoming", "SEQUEL")).toBe("Followed by");
  });
});
