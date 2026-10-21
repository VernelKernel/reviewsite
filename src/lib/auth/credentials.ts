const USERNAME_PATTERN = /^[a-z][a-z0-9_]{2,23}$/;

const RESERVED_USERNAMES = new Set([
  "about",
  "account",
  "admin",
  "administrator",
  "anonymous",
  "api",
  "dashboard",
  "edit",
  "frame",
  "games",
  "help",
  "login",
  "logout",
  "media",
  "moderator",
  "movie",
  "movies",
  "new",
  "null",
  "public",
  "review",
  "reviewer",
  "reviewers",
  "reviews",
  "root",
  "search",
  "settings",
  "signup",
  "static",
  "support",
  "system",
  "undefined",
  "verify",
]);

export function usernameError(value: string): string | null {
  const username = value.trim().toLowerCase();
  if (!username) return "Enter a username.";
  if (!USERNAME_PATTERN.test(username)) {
    return "Use 3–24 characters: a letter first, then letters, numbers, or underscores.";
  }
  if (RESERVED_USERNAMES.has(username)) return "That username is not available.";
  return null;
}

export function passwordError(password: string): string | null {
  if (password.length < 8 || password.length > 128) return "Use a password between 8 and 128 characters.";
  return null;
}

export function splitUsername(value: string): { username: string; displayName: string } | null {
  const displayName = value.trim();
  if (usernameError(displayName)) return null;
  return { username: displayName.toLowerCase(), displayName };
}
