export const LENSES = ["EXPERIENCE", "EXECUTION", "MIXED"] as const;
export const STANDARDS = ["ABSOLUTE", "CONTEXTUAL", "MIXED"] as const;
export const STANCES = ["POSITIVE", "MIXED", "NEGATIVE"] as const;
export const COMPLETIONS = [
  "JUST_STARTED",
  "EARLY",
  "SUBSTANTIAL",
  "COMPLETED",
  "ENDGAME",
  "POST_GAME",
  "ABANDONED",
  "UNKNOWN",
] as const;
export const PLAYTIME_BUCKETS = [
  "LESS_THAN_ONE_HOUR",
  "ONE_TO_FIVE_HOURS",
  "FIVE_TO_TEN_HOURS",
  "TEN_TO_TWENTY_HOURS",
  "TWENTY_TO_FIFTY_HOURS",
  "FIFTY_PLUS_HOURS",
  "UNKNOWN",
] as const;

export const GAME_DIMENSION_SLUGS = [
  "gameplay",
  "story",
  "music",
  "art-direction",
  "technical-quality",
  "performance",
  "controls",
  "atmosphere",
  "game-design",
] as const;

/** Experience questions for games. Movie-only enjoyment dimensions stay out of the game import. */
export const GAME_ENJOYMENT_DIMENSIONS = [
  { slug: "engagement", question: "Did it hold your attention?" },
  { slug: "fun", question: "Was the moment-to-moment experience enjoyable?" },
  { slug: "immersion", question: "Did you feel inside the work?" },
  { slug: "emotional-impact", question: "Did it make you feel something that mattered to you?" },
  { slug: "replay-appeal", question: "Would you want to experience it again?" },
  { slug: "satisfaction", question: "Did the experience feel rewarding or worthwhile?" },
] as const;

export const GAME_ENJOYMENT_SLUGS = [
  "engagement",
  "fun",
  "immersion",
  "emotional-impact",
  "replay-appeal",
  "satisfaction",
] as const;

export const OBSERVATION_TOPICS = [
  "tutorial",
  "controls",
  "performance",
  "difficulty",
  "pacing",
  "writing",
  "music",
  "technical-issues",
  "combat",
  "exploration",
  "story",
  "interface",
] as const;

export type Lens = (typeof LENSES)[number];
export type Standard = (typeof STANDARDS)[number];
export type Stance = (typeof STANCES)[number];
export type Completion = (typeof COMPLETIONS)[number];
export type PlaytimeBucket = (typeof PLAYTIME_BUCKETS)[number];
