import { describe, expect, it } from "vitest";
import { parseEvaluationForm } from "./evaluation";

function form(values: Record<string, string>, extras?: (data: FormData) => void) {
  const data = new FormData();
  for (const [key, value] of Object.entries(values)) data.set(key, value);
  extras?.(data);
  return data;
}

const base = {
  email: "ada@example.com",
  displayName: "Ada",
  lens: "EXECUTION",
  standard: "ABSOLUTE",
  enjoyment: "POSITIVE",
  execution: "NEGATIVE",
  completion: "COMPLETED",
  reviewBody: "The combat is readable and the ending is not. I finished it anyway.",
};

describe("evaluation validation", () => {
  it("accepts a concise evaluation that separates enjoyment from execution", () => {
    const result = parseEvaluationForm(form(base));
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.enjoyment).toBe("POSITIVE");
      expect(result.data.execution).toBe("NEGATIVE");
    }
  });

  it("rejects two judgments of the same dimension", () => {
    const result = parseEvaluationForm(
      form(base, (data) => {
        data.append("judgment:dim-1", "POSITIVE");
        data.append("judgment:dim-1", "NEGATIVE");
      }),
    );
    expect(result.ok).toBe(false);
  });

  it("keeps an impression inside 80 characters", () => {
    const impression = "The fights land. The missions start to repeat.";
    const result = parseEvaluationForm(form({ ...base, impression }));
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data.impression).toBe(impression);
    const tooLong = parseEvaluationForm(form({ ...base, impression: "x".repeat(81) }));
    expect(tooLong.ok).toBe(false);
  });

  it("requires pasted prose when the review is imported", () => {
    const result = parseEvaluationForm(form({ ...base, reviewBody: "", imported: "on" }));
    expect(result.ok).toBe(false);
  });

  it("requires a lens and a standard to publish", () => {
    const result = parseEvaluationForm(form({ ...base, lens: "", standard: "" }));
    expect(result.ok).toBe(false);
  });

  it("accepts a draft that has not chosen a lens yet", () => {
    const result = parseEvaluationForm(form({ ...base, lens: "", standard: "", intent: "draft" }));
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.intent).toBe("draft");
      expect(result.data.lens).toBeUndefined();
    }
  });

  it("still checks an observation that is present on a draft", () => {
    const result = parseEvaluationForm(
      form({ ...base, lens: "", standard: "", intent: "draft" }, (data) => {
        data.append("observationTopic", "topic-1");
        data.append("observationPolarity", "PRAISE");
        data.append("observationContent", "Nope");
      }),
    );
    expect(result.ok).toBe(false);
  });
});
