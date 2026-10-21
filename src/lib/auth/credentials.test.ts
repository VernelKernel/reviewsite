import { describe, expect, it } from "vitest";
import { passwordError, splitUsername, usernameError } from "./credentials";
import { hashPassword, verifyPassword } from "./password";

describe("account credentials", () => {
  it("accepts a normal username and keeps its capitalization for the public name", () => {
    expect(usernameError("Ada")).toBeNull();
    expect(splitUsername("  Ada ")).toEqual({ username: "ada", displayName: "Ada" });
  });

  it("rejects short, symbolic, and reserved usernames", () => {
    expect(usernameError("ab")).toMatch(/3–24/);
    expect(usernameError("ada lovelace")).toMatch(/3–24/);
    expect(usernameError("admin")).toMatch(/not available/);
    expect(splitUsername("login")).toBeNull();
  });

  it("requires a password between 8 and 128 characters", () => {
    expect(passwordError("short")).toMatch(/8 and 128/);
    expect(passwordError("a".repeat(129))).toMatch(/8 and 128/);
    expect(passwordError("correct-horse")).toBeNull();
  });

  it("verifies the password that was hashed and rejects a different one", async () => {
    const stored = await hashPassword("correct-horse");
    expect(await verifyPassword("correct-horse", stored)).toBe(true);
    expect(await verifyPassword("wrong-horse", stored)).toBe(false);
    expect(await verifyPassword("correct-horse", "plaintext")).toBe(false);
  });
});
