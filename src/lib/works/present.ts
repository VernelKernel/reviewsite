import type { CardWork, FullWork } from "./queries";
import {
  splitLandscapes,
  type LandscapeEvaluation,
  type PairedLandscapes,
  type Population,
  type ReviewLandscape,
} from "../aggregation/landscape";
import { relationPhrase, type RelationKindValue } from "../domain/relations";
import { workHref } from "../domain/labels";

const roleLabel: Record<string, string> = {
  DEVELOPER: "Developer",
  PUBLISHER: "Publisher",
  STUDIO: "Studio",
  DIRECTOR: "Director",
  WRITER: "Writer",
  COMPOSER: "Composer",
  ARTIST: "Artist",
  ACTOR: "Actor",
  PRODUCER: "Producer",
  OTHER: "Contributor",
};

export function roleName(role: string): string {
  return roleLabel[role] ?? role;
}

export function releaseYear(releases: { releasedOn: Date | null }[]): number | null {
  const dated = releases.map((release) => release.releasedOn).filter((date): date is Date => date instanceof Date);
  if (dated.length === 0) return null;
  return new Date(Math.min(...dated.map((date) => date.getTime()))).getUTCFullYear();
}

export type Art = { src: string; alt: string };
export type WorkArt = { wide: Art | null; tall: Art | null };

const wideKinds = new Set(["KEY_ART", "SCREENSHOT"]);
const tallKinds = new Set(["POSTER", "COVER"]);

export function workArt(media: { kind: string; src: string; alt: string; isPrimary: boolean }[]): WorkArt {
  const pick = (kinds: Set<string>): Art | null => {
    const item = media.find((entry) => kinds.has(entry.kind) && entry.isPrimary) ?? media.find((entry) => kinds.has(entry.kind));
    return item ? { src: item.src, alt: item.alt } : null;
  };
  return { wide: pick(wideKinds), tall: pick(tallKinds) };
}

export function creatorLine(creators: { role: string; creator: { name: string } }[]): string {
  const developers = creators.filter((creator) => creator.role === "DEVELOPER" || creator.role === "DIRECTOR");
  const names = (developers.length > 0 ? developers : creators).map((creator) => creator.creator.name);
  return [...new Set(names)].join(", ");
}

export function toLandscapeInput(evaluation: {
  lens: LandscapeEvaluation["lens"];
  standard: LandscapeEvaluation["standard"];
  enjoyment: LandscapeEvaluation["enjoyment"];
  execution: LandscapeEvaluation["execution"];
  completion: string;
  population?: Population | string;
  outletName?: string | null;
  review?: { importSourceName: string | null } | null;
  judgments: {
    stance: LandscapeEvaluation["judgments"][number]["stance"];
    dimension: { slug: string; name: string; sortOrder?: number; family?: "WORK" | "ENJOYMENT" };
  }[];
  observations: { polarity: LandscapeEvaluation["observations"][number]["polarity"]; topic: { slug: string; name: string } }[];
}): LandscapeEvaluation & { population: Population } {
  return {
    population: evaluation.population === "CRITIC" ? "CRITIC" : "AUDIENCE",
    outletName: evaluation.outletName ?? evaluation.review?.importSourceName ?? null,
    lens: evaluation.lens,
    standard: evaluation.standard,
    enjoyment: evaluation.enjoyment,
    execution: evaluation.execution,
    completion: evaluation.completion,
    judgments: evaluation.judgments.map((judgment) => ({
      dimensionSlug: judgment.dimension.slug,
      dimensionName: judgment.dimension.name,
      stance: judgment.stance,
      sortOrder: judgment.dimension.sortOrder,
      family: judgment.dimension.family === "ENJOYMENT" ? "ENJOYMENT" : "WORK",
    })),
    observations: evaluation.observations.map((observation) => ({
      topicSlug: observation.topic.slug,
      topicName: observation.topic.name,
      polarity: observation.polarity,
    })),
  };
}

export function landscapesFor(work: { evaluations: Parameters<typeof toLandscapeInput>[0][] }): PairedLandscapes {
  return splitLandscapes(work.evaluations.map(toLandscapeInput));
}

/** Audience landscape. Discovery shelves compare audience evaluations with each other. */
export function landscapeFor(work: { evaluations: Parameters<typeof toLandscapeInput>[0][] }): ReviewLandscape {
  return landscapesFor(work).audience;
}

export type RelatedView = { href: string; phrase: string; title: string };

export function relatedLinks(
  work: FullWork,
  byCreator: { title: string; slug: string; workType: string }[],
): RelatedView[] {
  const links: RelatedView[] = [];
  for (const relation of work.relationsFrom) {
    if (relation.to.status !== "PUBLISHED") continue;
    links.push({
      href: workHref(relation.to.workType, relation.to.slug),
      phrase: relationPhrase("outgoing", relation.kind as RelationKindValue),
      title: relation.to.title,
    });
  }
  for (const relation of work.relationsTo) {
    if (relation.from.status !== "PUBLISHED") continue;
    links.push({
      href: workHref(relation.from.workType, relation.from.slug),
      phrase: relationPhrase("incoming", relation.kind as RelationKindValue),
      title: relation.from.title,
    });
  }
  for (const other of byCreator) {
    const href = workHref(other.workType, other.slug);
    if (links.some((link) => link.href === href)) continue;
    links.push({ href, phrase: "Same creator", title: other.title });
  }
  return links;
}

export function formatDate(value: Date | null): string | null {
  if (!value) return null;
  return new Intl.DateTimeFormat("en", { month: "long", year: "numeric", timeZone: "UTC" }).format(value);
}

/** Month span covered by the given evaluation dates, or null when there are none. */
export function snapshotPeriod(dates: Date[]): string | null {
  if (dates.length === 0) return null;
  const times = dates.map((date) => date.getTime());
  const first = formatDate(new Date(Math.min(...times)));
  const last = formatDate(new Date(Math.max(...times)));
  return first === last ? first : `${first} to ${last}`;
}

export type { CardWork, FullWork };
