export const COMPARE_LIMIT = 4;

export type CompareRef = {
  workType: string;
  slug: string;
  title: string;
};

export function compareKey(item: { workType: string; slug: string }): string {
  const type = item.workType === "MOVIE" ? "movies" : "games";
  return `${type}/${item.slug}`;
}

export function compareHref(items: { workType: string; slug: string }[]): string {
  const works = items.map(compareKey).join(",");
  return works ? `/compare?works=${encodeURIComponent(works)}` : "/compare";
}

export function parseCompareKeys(value: string | undefined): { workType: "GAME" | "MOVIE"; slug: string }[] {
  if (!value) return [];
  const seen = new Set<string>();
  const result: { workType: "GAME" | "MOVIE"; slug: string }[] = [];
  for (const part of value.split(",")) {
    const [type, slug] = part.split("/");
    if (!slug || (type !== "games" && type !== "movies")) continue;
    const key = `${type}/${slug}`;
    if (seen.has(key)) continue;
    seen.add(key);
    result.push({ workType: type === "movies" ? "MOVIE" : "GAME", slug });
    if (result.length === COMPARE_LIMIT) break;
  }
  return result;
}
