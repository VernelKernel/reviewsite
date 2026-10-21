import { DomainError } from "../domain/relations";

const sendHits = new Map<string, number[]>();
const loginHits = new Map<string, number[]>();
const SEND_WINDOW_MS = 60 * 60 * 1000;
const SEND_LIMIT = 5;
const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const LOGIN_LIMIT = 8;

export function assertAuthSendRate(email: string): void {
  const now = Date.now();
  const recent = (sendHits.get(email) ?? []).filter((timestamp) => now - timestamp < SEND_WINDOW_MS);
  if (recent.length >= SEND_LIMIT) {
    throw new DomainError("Too many verification emails were sent to this address in the last hour. Try again later.");
  }
  recent.push(now);
  sendHits.set(email, recent);
}

export function assertLoginAllowed(key: string): void {
  const now = Date.now();
  const recent = (loginHits.get(key) ?? []).filter((timestamp) => now - timestamp < LOGIN_WINDOW_MS);
  loginHits.set(key, recent);
  if (recent.length >= LOGIN_LIMIT) {
    throw new DomainError("Too many sign-in attempts. Try again later.");
  }
}

export function recordLoginFailure(key: string): void {
  const now = Date.now();
  const recent = (loginHits.get(key) ?? []).filter((timestamp) => now - timestamp < LOGIN_WINDOW_MS);
  recent.push(now);
  loginHits.set(key, recent);
}

export function clearLoginFailures(key: string): void {
  loginHits.delete(key);
}
