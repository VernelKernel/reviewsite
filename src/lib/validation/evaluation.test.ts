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

  it("requires pasted prose when the review is imported", () => {
    const result = parseEvaluationForm(form({ ...base, reviewBody: "", imported: "on" }));
    expect(result.ok).toBe(false);
  });
});
