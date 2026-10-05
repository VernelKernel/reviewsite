import { DomainError } from "../domain/relations";

const hits = new Map<string, number[]>();
const WINDOW_MS = 60 * 60 * 1000;
const LIMIT = 20;

export function assertSubmissionRate(key: string): void {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((timestamp) => now - timestamp < WINDOW_MS);
  if (recent.length >= LIMIT) {
    throw new DomainError("Too many evaluations were submitted for this identity in the last hour. Try again later.");
  }
  recent.push(now);
  hits.set(key, recent);
}
