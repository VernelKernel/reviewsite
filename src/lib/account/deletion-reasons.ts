export const ACCOUNT_DELETION_REASONS = [
  { value: "NOT_USING", label: "I'm not using this anymore" },
  { value: "PRIVACY", label: "I want less of my account kept" },
  { value: "HARD_TO_USE", label: "The site is hard to use" },
  { value: "NEW_ACCOUNT", label: "I'm starting over with a new account" },
  { value: "OTHER", label: "Other" },
] as const;

export type AccountDeletionReasonValue = (typeof ACCOUNT_DELETION_REASONS)[number]["value"];

export function parseDeletionReason(value: string): AccountDeletionReasonValue | null {
  const match = ACCOUNT_DELETION_REASONS.find((reason) => reason.value === value);
  return match ? match.value : null;
}
