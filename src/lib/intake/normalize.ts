const LEADING_ARTICLE = /^(the|a|an)\s+/;
const EDITION =
  /\b(goty|game of the year|remastered|remaster|definitive edition|definitive|deluxe edition|deluxe|complete edition|anniversary edition)\b/g;
const YEAR = /\b(?:19|20)\d{2}\b/g;

export function normalizeTitle(input: string): string {
  let value = input.normalize("NFKD").replace(/\p{M}/gu, "").toLowerCase();
  value = value.replace(/&/g, " and ");
  value = value.replace(/[’']/g, "");
  value = value.replace(/\(([^)]*)\)|\[([^\]]*)\]/g, " $1 $2 ");
  value = value.replace(EDITION, " ");
  value = value.replace(YEAR, " ");
  value = value.replace(/[^a-z0-9]+/g, " ");
  value = value.replace(/\s+/g, " ").trim();
  value = value.replace(LEADING_ARTICLE, "").trim();
  return value;
}

export function trigramSimilarity(left: string, right: string): number {
  const a = grams(left);
  const b = grams(right);
  if (a.size === 0 || b.size === 0) return left === right ? 1 : 0;
  let shared = 0;
  for (const gram of a) if (b.has(gram)) shared += 1;
  return (2 * shared) / (a.size + b.size);
}

function grams(value: string): Set<string> {
  const padded = `  ${value} `;
  const found = new Set<string>();
  for (let index = 0; index < padded.length - 2; index += 1) found.add(padded.slice(index, index + 3));
  return found;
}
