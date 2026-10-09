import { describe, expect, it } from "vitest";
import { decideMatch } from "./match";

describe("decideMatch", () => {
  it("prefers one exact normalized title over a higher fuzzy score", () => {
    const decision = decideMatch("hades", [
      { id: "other", title: "Hades II", score: 0.9 },
      { id: "hades", title: "The Hades", score: 0.4 },
    ]);
    expect(decision).toEqual({ kind: "match", id: "hades" });
  });

  it("holds two exact titles instead of attaching", () => {
    const decision = decideMatch("control", [
      { id: "a", title: "Control", score: 1 },
      { id: "b", title: "Control", score: 1 },
    ]);
    expect(decision.kind).toBe("ambiguous");
  });

  it("attaches one clear neighbor", () => {
    const decision = decideMatch("ace combat", [
      { id: "near", title: "Something Else", score: 0.8 },
      { id: "far", title: "Unrelated", score: 0.2 },
    ]);
    expect(decision).toEqual({ kind: "match", id: "near" });
  });

  it("holds two close neighbors", () => {
    const decision = decideMatch("ace", [
      { id: "a", title: "Ace One", score: 0.7 },
      { id: "b", title: "Ace Two", score: 0.62 },
    ]);
    expect(decision).toEqual({ kind: "ambiguous", ids: ["a", "b"] });
  });

  it("misses a weak single neighbor", () => {
    expect(decideMatch("hades", [{ id: "a", title: "Other", score: 0.4 }])).toEqual({ kind: "miss" });
  });
});
