export const lensLabel: Record<string, string> = {
  EXECUTION: "Execution-focused",
  EXPERIENCE: "Experience-focused",
  MIXED: "Mixed approach",
};

export const standardLabel: Record<string, string> = {
  ABSOLUTE: "Absolute standard",
  CONTEXTUAL: "Contextual standard",
  MIXED: "Mixed standard",
};

export const stanceLabel: Record<string, string> = {
  POSITIVE: "Positive",
  MIXED: "Mixed",
  NEGATIVE: "Negative",
};

export const completionLabel: Record<string, string> = {
  JUST_STARTED: "Just started",
  EARLY: "Early portion",
  SUBSTANTIAL: "Substantial portion",
  COMPLETED: "Completed",
  ENDGAME: "Endgame",
  POST_GAME: "Post-game",
  ABANDONED: "Abandoned",
  UNKNOWN: "Completion unknown",
};

export const playtimeLabel: Record<string, string> = {
  LESS_THAN_ONE_HOUR: "Under an hour",
  ONE_TO_FIVE_HOURS: "1–5 hours",
  FIVE_TO_TEN_HOURS: "5–10 hours",
  TEN_TO_TWENTY_HOURS: "10–20 hours",
  TWENTY_TO_FIFTY_HOURS: "20–50 hours",
  FIFTY_PLUS_HOURS: "50+ hours",
  UNKNOWN: "Playtime unknown",
};

export const ownershipLabel: Record<string, string> = {
  OWNED: "Owned",
  GIFTED: "Gifted",
  SUBSCRIPTION: "Subscription",
  BORROWED: "Borrowed",
  REVIEW_COPY: "Review copy",
  FREE: "Free",
  OTHER: "Other access",
};

export const workTypeLabel: Record<string, string> = {
  GAME: "Game",
  MOVIE: "Movie",
  TV_SERIES: "Series",
  BOOK: "Book",
  ALBUM: "Album",
  OTHER: "Work",
};

export const workTypePath: Record<string, string> = {
  GAME: "games",
  MOVIE: "movies",
  TV_SERIES: "series",
  BOOK: "books",
  ALBUM: "albums",
  OTHER: "works",
};

export function workHref(workType: string, slug: string): string {
  return `/${workTypePath[workType] ?? "works"}/${slug}`;
}

export function evaluateHref(workType: string, slug: string): string {
  return `${workHref(workType, slug)}/evaluate`;
}

export function reviewHref(workType: string, workSlug: string, reviewerSlug: string): string {
  return `${workHref(workType, workSlug)}/reviews/${reviewerSlug}`;
}

export function reviewerHref(slug: string): string {
  return `/reviewers/${slug}`;
}

export function stanceClass(stance: string): string {
  if (stance === "POSITIVE") return "stance stance-positive";
  if (stance === "NEGATIVE") return "stance stance-negative";
  return "stance stance-mixed";
}
