import { describe, expect, it } from "vitest";
import { parseDeletionReason } from "../account/deletion-reasons";
import { isValidEmail, normalizeCode, normalizeEmail } from "./email";

describe("email sign-in helpers", () => {
  it("normalizes an address", () => {
    expect(normalizeEmail("  Person@Example.com ")).toBe("person@example.com");
    expect(isValidEmail("person@example.com")).toBe(true);
    expect(isValidEmail("not-an-email")).toBe(false);
  });

  it("accepts a 6-digit code and rejects anything else", () => {
    expect(normalizeCode("482 916")).toBe("482916");
    expect(normalizeCode("12345")).toBeNull();
    expect(normalizeCode("1234567")).toBeNull();
    expect(normalizeCode("12ab56")).toBeNull();
  });

  it("accepts only the deletion reasons", () => {
    expect(parseDeletionReason("PRIVACY")).toBe("PRIVACY");
    expect(parseDeletionReason("PRICING")).toBeNull();
  });
});
