export const RELATION_KINDS = [
  "SAME_SERIES",
  "SEQUEL",
  "PREQUEL",
  "SPIRITUAL_SUCCESSOR",
  "ADAPTATION",
  "REMAKE",
  "REMASTER",
  "RELATED",
] as const;

export type RelationKindValue = (typeof RELATION_KINDS)[number];

export class DomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DomainError";
  }
}

export function assertValidWorkRelation(fromWorkId: string, toWorkId: string): void {
  if (fromWorkId === toWorkId) {
    throw new DomainError("A work cannot be related to itself.");
  }
}

export function relationPhrase(direction: "outgoing" | "incoming", kind: RelationKindValue): string {
  const phrases: Record<RelationKindValue, { outgoing: string; incoming: string }> = {
    SEQUEL: { outgoing: "Sequel of", incoming: "Followed by" },
    PREQUEL: { outgoing: "Prequel of", incoming: "Preceded by" },
    SAME_SERIES: { outgoing: "Same series as", incoming: "Same series as" },
    SPIRITUAL_SUCCESSOR: { outgoing: "Spiritual successor to", incoming: "Spiritual predecessor of" },
    ADAPTATION: { outgoing: "Adaptation of", incoming: "Adapted as" },
    REMAKE: { outgoing: "Remake of", incoming: "Remade as" },
    REMASTER: { outgoing: "Remaster of", incoming: "Remastered as" },
    RELATED: { outgoing: "Related to", incoming: "Related to" },
  };
  return phrases[kind][direction];
}
