const MODEL = process.env.GEMINI_MODEL || "gemini-3.8-flash";

export type ChoiceCandidate = { key: string; label: string };

export type ChoiceResult = { status: "chosen"; key: string } | { status: "none" } | { status: "skipped" };

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function chooseCandidate(input: {
  rawTitle: string;
  normalizedTitle: string;
  platform: string | null;
  genre: string | null;
  candidates: ChoiceCandidate[];
}): Promise<ChoiceResult> {
  const key = process.env.GEMINI_API_KEY?.trim();
  if (!key || input.candidates.length === 0) return { status: "skipped" };
  const allowed = new Set(input.candidates.map((candidate) => candidate.key));
  const prompt = [
    "Match a typed title to one candidate, or to none.",
    'Return JSON {"key": string | null}. The key must be copied from the list, or null.',
    `Typed title: ${input.rawTitle}`,
    `Normalized title: ${input.normalizedTitle}`,
    `Platform: ${input.platform?.trim() || "not specified"}`,
    `Genre: ${input.genre?.trim() || "not specified"}`,
    "Candidates:",
    ...input.candidates.map((candidate) => `- ${candidate.key}: ${candidate.label}`),
    "Choose null when none is the same work. Do not invent a key.",
  ].join("\n");

  try {
    const payload = await generate(key, prompt);
    const record = payload !== null && typeof payload === "object" ? (payload as { key?: unknown }) : null;
    if (!record || !("key" in record) || record.key === null || record.key === "null") return { status: "none" };
    if (typeof record.key === "string" && allowed.has(record.key)) return { status: "chosen", key: record.key };
    return { status: "none" };
  } catch (error) {
    console.error(`Title chooser skipped: ${error instanceof Error ? error.message : "request failed"}`);
    return { status: "skipped" };
  }
}

async function generate(key: string, prompt: string): Promise<unknown> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;
  let lastStatus = 0;
  let lastBody = "";
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": key },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0,
          maxOutputTokens: 256,
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
    if (!response.ok) throw new Error(`Gemini returned ${response.status}. ${lastBody.slice(0, 180)}`);
    const payload = JSON.parse(lastBody) as { candidates?: { content?: { parts?: { text?: string }[] } }[] };
    const text = payload.candidates?.[0]?.content?.parts?.map((part) => part.text ?? "").join("") ?? "";
    if (!text.trim()) throw new Error("Gemini returned an empty reading.");
    return JSON.parse(text.replace(/^```json\s*/i, "").replace(/```$/, "").trim());
  }
  throw new Error(`Gemini returned ${lastStatus} after retries.`);
}
