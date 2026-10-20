export type StoredSection = {
  dimensionId: string | null;
  body: string;
};

export type SectionBlock = {
  dimensionId: string;
  body: string;
};

export function flattenSections(sections: { body: string }[]): string {
  return sections
    .map((section) => section.body.trim())
    .filter(Boolean)
    .join("\n\n");
}

export function readSectionFields(formData: FormData): StoredSection[] {
  const sections: StoredSection[] = [];
  const opening = String(formData.get("reviewOpening") ?? "").trim();
  if (opening) sections.push({ dimensionId: null, body: opening });

  const ids = formData.getAll("sectionDimension").map(String);
  const bodies = formData.getAll("sectionBody").map(String);
  const count = Math.max(ids.length, bodies.length);
  for (let index = 0; index < count; index += 1) {
    const body = (bodies[index] ?? "").trim();
    const dimensionId = (ids[index] ?? "").trim();
    if (!body || !dimensionId) continue;
    sections.push({ dimensionId, body });
  }
  return sections;
}

export function readStoredSections(value: unknown): StoredSection[] {
  if (!Array.isArray(value)) return [];
  const sections: StoredSection[] = [];
  for (const item of value) {
    if (!item || typeof item !== "object") continue;
    const record = item as { dimensionId?: unknown; body?: unknown };
    const body = typeof record.body === "string" ? record.body.trim() : "";
    if (!body) continue;
    const dimensionId = typeof record.dimensionId === "string" && record.dimensionId ? record.dimensionId : null;
    sections.push({ dimensionId, body });
  }
  return sections;
}

/** Keep sections whose dimension still applies. Other written text joins the opening. */
export function foldSections(sections: StoredSection[], allowed: ReadonlySet<string>): StoredSection[] {
  const lead: string[] = [];
  const kept: StoredSection[] = [];
  for (const section of sections) {
    const body = section.body.trim();
    if (!body) continue;
    if (section.dimensionId && allowed.has(section.dimensionId)) {
      kept.push({ dimensionId: section.dimensionId, body });
      continue;
    }
    lead.push(body);
  }
  const opening = lead.join("\n\n");
  return opening ? [{ dimensionId: null, body: opening }, ...kept] : kept;
}

/** Drop an empty block whose dimension is no longer judged. Keep written prose. Append newly judged dimensions. */
export function syncSectionBlocks(blocks: SectionBlock[], judgedIds: string[]): SectionBlock[] {
  const judged = new Set(judgedIds);
  const kept = blocks.filter((block) => judged.has(block.dimensionId) || block.body.trim().length > 0);
  const present = new Set(kept.map((block) => block.dimensionId));
  const appended = judgedIds
    .filter((id) => !present.has(id))
    .map((dimensionId) => ({ dimensionId, body: "" }));
  const next = [...kept, ...appended];
  if (next.length === blocks.length && next.every((block, index) => block === blocks[index])) return blocks;
  return next;
}

export function rememberJudgment(order: string[], dimensionId: string, stance: string): string[] {
  if (!stance) return order;
  return order.includes(dimensionId) ? order : [...order, dimensionId];
}

export function judgedDimensions(
  dimensions: { id: string; name: string }[],
  judgments: Record<string, string>,
  order: string[],
): { id: string; name: string; stance: string }[] {
  const byId = new Map(dimensions.map((dimension) => [dimension.id, dimension]));
  const seen = new Set<string>();
  const result: { id: string; name: string; stance: string }[] = [];
  for (const id of [...order, ...Object.keys(judgments)]) {
    const stance = judgments[id];
    const dimension = byId.get(id);
    if (!dimension || !stance || seen.has(id)) continue;
    seen.add(id);
    result.push({ id, name: dimension.name, stance });
  }
  return result;
}
