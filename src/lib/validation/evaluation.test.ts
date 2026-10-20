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

  it("ignores dimension sections when the review is imported", () => {
    const result = parseEvaluationForm(
      form({ ...base, imported: "on", reviewMode: "sections" }, (data) => {
        data.set("reviewOpening", "This opening should not replace the pasted review.");
        data.append("sectionDimension", "story");
        data.append("sectionBody", "The plot lost me, and that decided it.");
      }),
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.sections).toEqual([]);
      expect(result.data.reviewBody).toBe(base.reviewBody);
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
