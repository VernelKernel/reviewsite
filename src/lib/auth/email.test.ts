import { describe, expect, it } from "vitest";
import { parseDeletionReason } from "../account/deletion-reasons";
import { isValidEmail, normalizeEmail } from "./email";

describe("email helpers", () => {
  it("normalizes an address", () => {
    expect(normalizeEmail("  Person@Example.com ")).toBe("person@example.com");
    expect(isValidEmail("person@example.com")).toBe(true);
    expect(isValidEmail("not-an-email")).toBe(false);
  });

  it("accepts only the deletion reasons", () => {
    expect(parseDeletionReason("PRIVACY")).toBe("PRIVACY");
    expect(parseDeletionReason("PRICING")).toBeNull();
  });
});
