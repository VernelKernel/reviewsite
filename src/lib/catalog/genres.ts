export const CANONICAL_GENRES: { slug: string; name: string }[] = [
  { slug: "action", name: "Action" },
  { slug: "role-playing", name: "Role-playing" },
  { slug: "shooter", name: "Shooter" },
  { slug: "adventure", name: "Adventure" },
  { slug: "strategy", name: "Strategy" },
  { slug: "simulation", name: "Simulation" },
  { slug: "sports-and-racing", name: "Sports and racing" },
  { slug: "platformer", name: "Platformer" },
  { slug: "horror", name: "Horror" },
  { slug: "roguelike", name: "Roguelike" },
  { slug: "puzzle", name: "Puzzle" },
  { slug: "fighting", name: "Fighting" },
];

const CANONICAL = new Set(CANONICAL_GENRES.map((genre) => genre.slug));

const RULES: { slug: string; pattern: RegExp }[] = [
  { slug: "roguelike", pattern: /\brogue[\s-]?(like|lite)\b/i },
  { slug: "shooter", pattern: /\b(shooter|fps)\b/i },
  { slug: "role-playing", pattern: /\b(rpg|role[\s-]?playing)\b/i },
  { slug: "horror", pattern: /\bhorror\b/i },
  { slug: "fighting", pattern: /\bfighting\b/i },
  { slug: "puzzle", pattern: /\bpuzzle\b/i },
  { slug: "platformer", pattern: /\bplatform(er|ing)?\b/i },
  { slug: "sports-and-racing", pattern: /\b(racing|sports?)\b/i },
  { slug: "strategy", pattern: /\bstrategy\b/i },
  { slug: "simulation", pattern: /\bsim(ulation)?\b/i },
  { slug: "adventure", pattern: /\b(adventure|narrative|visual novel)\b/i },
  { slug: "action", pattern: /\baction\b/i },
];

export function isCanonicalGenre(slug: string): boolean {
  return CANONICAL.has(slug);
}

export function mapSteamLabels(labels: string[]): { primary: string | null; secondary: string[] } {
  const found: string[] = [];
  const haystack = labels.join(" · ");
  for (const rule of RULES) {
    if (rule.pattern.test(haystack) && !found.includes(rule.slug)) found.push(rule.slug);
  }
  return { primary: found[0] ?? null, secondary: found.slice(1) };
}
