import { DomainError } from "../domain/relations";

const hits = new Map<string, number[]>();
const WINDOW_MS = 60 * 60 * 1000;
const SEND_LIMIT = 5;

export function assertAuthSendRate(email: string): void {
  const now = Date.now();
  const recent = (hits.get(email) ?? []).filter((timestamp) => now - timestamp < WINDOW_MS);
  if (recent.length >= SEND_LIMIT) {
    throw new DomainError("Too many codes were sent to this email in the last hour. Try again later.");
  }
  recent.push(now);
  hits.set(email, recent);
}
