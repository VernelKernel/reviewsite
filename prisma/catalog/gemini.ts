import { interpretationPrompt, parseInterpretation, type Interpretation } from "../../src/lib/catalog/interpret";

const MODEL = process.env.GEMINI_MODEL || "gemini-3.8-flash";

export class GeminiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function apiKey(): string {
  const key = process.env.GEMINI_API_KEY?.trim();
  if (!key) throw new GeminiError("GEMINI_API_KEY is missing.", 0);
  return key;
}

async function generate(prompt: string, temperature: number): Promise<unknown> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;
  let lastStatus = 0;
  let lastBody = "";
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey(),
      },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          temperature,
          maxOutputTokens: 2048,
          responseMimeType: "application/json",
          thinkingConfig: { thinkingBudget: 0 },
        },
      }),
      signal: AbortSignal.timeout(45000),
    });
    lastStatus = response.status;
    lastBody = await response.text();
    if (response.status === 429 || response.status === 503) {
      await sleep(2000 * 2 ** attempt);
      continue;
    }
    if (!response.ok) {
      throw new GeminiError(`Gemini returned ${response.status}. ${lastBody.slice(0, 240)}`, response.status);
    }
    const payload = JSON.parse(lastBody) as { candidates?: { content?: { parts?: { text?: string }[] } }[] };
    const text = payload.candidates?.[0]?.content?.parts?.map((part) => part.text ?? "").join("") ?? "";
    if (!text.trim()) throw new GeminiError("Gemini returned an empty reading.", response.status);
    return JSON.parse(text.replace(/^```json\s*/i, "").replace(/```$/, "").trim());
  }
  throw new GeminiError(`Gemini returned ${lastStatus} after retries. ${lastBody.slice(0, 240)}`, lastStatus);
}

export async function assertGeminiReady(): Promise<void> {
  const payload = await generate('Return {"ok":true}', 0);
  const record = payload !== null && typeof payload === "object" ? (payload as { ok?: unknown }) : null;
  if (record?.ok !== true) throw new GeminiError("Gemini did not answer the readiness check.", 200);
}

export async function interpretReview(input: {
  title: string;
  body: string;
  votedUp: boolean;
  playtimeMinutes: number | null;
  earlyAccess: boolean;
}): Promise<Interpretation | null> {
  const payload = await generate(interpretationPrompt(input), 0.2);
  return parseInterpretation(payload);
}
