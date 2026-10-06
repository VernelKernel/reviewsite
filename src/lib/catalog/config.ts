export const CAMPAIGN_FLOOR = "2026-01-01";
export const NEWEST_DAYS = 30;
/** First run uses the run date, so a run in early October starts there. */
export const INITIAL_ANCHOR_LAG_DAYS = 0;
export const REVIEWS_PER_GAME = 8;
export const MIN_REVIEW_CHARS = 80;
/** Games under this many evaluations are left for the separate backfill. */
export const THIN_EVALUATION_LIMIT = 4;
export const BACKFILL_MIN_REVIEW_CHARS = 40;
export const BACKFILL_PAGES = 5;
export const BACKFILL_PAGE_SIZE = 100;
export const RECENT_START_DAYS = 60;
export const RECENT_END_DAYS = 100;
export const SETTLED_START_DAYS = 120;
export const SETTLED_END_DAYS = 365;
export const WIDEN_DAYS = 15;
export const WIDEN_LIMIT = 2;
export const GENRE_CAP = 8;
export const BUZZ_REVIEWS = 200;
export const BUZZ_PLAYERS = 1000;
export const HYDRATION_PER_BAND = 100;
export const CAMPAIGN_SAMPLE = 120;

export const SLOT_QUOTAS = {
  NEW_AAA: 5,
  NEW_INDIE: 5,
  RECENT_AAA: 8,
  RECENT_AA: 5,
  RECENT_INDIE: 2,
  SETTLED_AAA: 5,
  SETTLED_AA: 5,
  SETTLED_INDIE: 5,
  MULTIPLATFORM: 5,
  GENRE_DEBT: 5,
} as const;

export type Slot = keyof typeof SLOT_QUOTAS;
export type Tier = "AAA" | "AA" | "INDIE";

export const CONSOLE_PLATFORMS = ["playstation-5", "xbox-series", "switch"] as const;
export type ConsolePlatform = (typeof CONSOLE_PLATFORMS)[number];
