import { describe, expect, it } from "vitest";
import { parseEvaluationForm } from "./evaluation";

function form(values: Record<string, string>, extras?: (data: FormData) => void) {
  const data = new FormData();
  for (const [key, value] of Object.entries(values)) data.set(key, value);
  extras?.(data);
  return data;
}

const base = {
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

  it("requires how much a judged dimension mattered", () => {
    const missing = parseEvaluationForm(
      form(base, (data) => {
        data.append("judgment:dim-1", "POSITIVE");
      }),
    );
    expect(missing.ok).toBe(false);
    if (!missing.ok) expect(missing.message).toBe("Say how much each judged dimension mattered.");

    const kept = parseEvaluationForm(
      form(base, (data) => {
        data.append("judgment:dim-1", "NEGATIVE");
        data.append("mattered:dim-1", "MATTERS_A_LOT");
      }),
    );
    expect(kept.ok).toBe(true);
    if (kept.ok) expect(kept.data.judgments).toEqual([{ dimensionId: "dim-1", stance: "NEGATIVE", mattered: "MATTERS_A_LOT" }]);
  });

  it("rejects two judgments of the same dimension", () => {
    const result = parseEvaluationForm(
      form(base, (data) => {
        data.append("judgment:dim-1", "POSITIVE");
        data.append("mattered:dim-1", "A_LITTLE");
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

  it("accepts a draft", () => {
    const result = parseEvaluationForm(form({ ...base, intent: "draft" }));
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.intent).toBe("draft");
  });

  it("builds the review from dimension sections and drops empty blocks", () => {
    const result = parseEvaluationForm(
      form({ ...base, reviewBody: "", reviewMode: "sections" }, (data) => {
        data.set("reviewOpening", "I came for the story.");
        data.append("sectionDimension", "story");
        data.append("sectionBody", "The plot lost me, and that decided it.");
        data.append("sectionDimension", "gameplay");
        data.append("sectionBody", "   ");
      }),
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.sections).toEqual([
        { dimensionId: null, body: "I came for the story." },
        { dimensionId: "story", body: "The plot lost me, and that decided it." },
      ]);
      expect(result.data.reviewBody).toBe("I came for the story.\n\nThe plot lost me, and that decided it.");
    }
  });

  it("keeps a written dimension that has no judgment", () => {
    const result = parseEvaluationForm(
      form({ ...base, reviewBody: "", reviewMode: "sections" }, (data) => {
        data.append("sectionDimension", "story");
        data.append("sectionBody", "The plot lost me, and that decided the experience.");
      }),
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.judgments).toEqual([]);
      expect(result.data.sections).toEqual([
        { dimensionId: "story", body: "The plot lost me, and that decided the experience." },
      ]);
    }
  });

  it("rejects a review section that is too short to say anything", () => {
    const result = parseEvaluationForm(
      form({ ...base, reviewBody: "", reviewMode: "sections" }, (data) => {
        data.set("reviewOpening", "Too short");
      }),
    );
    expect(result.ok).toBe(false);
  });

  it("rejects two sections for the same dimension", () => {
    const prose = "The combat is readable and the ending is not.";
    const result = parseEvaluationForm(
      form({ ...base, reviewBody: "", reviewMode: "sections" }, (data) => {
        data.append("sectionDimension", "story");
        data.append("sectionBody", prose);
        data.append("sectionDimension", "story");
        data.append("sectionBody", prose);
      }),
    );
    expect(result.ok).toBe(false);
  });
});
