const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

export function isValidEmail(value: string): boolean {
  return value.length <= 180 && EMAIL_PATTERN.test(value);
}

export function normalizeCode(value: string): string | null {
  const digits = value.replace(/\s+/g, "");
  return /^\d{6}$/.test(digits) ? digits : null;
}
