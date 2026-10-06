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

export function primaryArt(media: { kind: string; src: string; alt: string; isPrimary: boolean }[]) {
  const primary = media.find((item) => item.isPrimary) ?? media.find((item) => item.kind === "KEY_ART" || item.kind === "POSTER") ?? media[0];
  return primary ? { src: primary.src, alt: primary.alt } : null;
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
  judgments: { stance: LandscapeEvaluation["judgments"][number]["stance"]; dimension: { slug: string; name: string } }[];
  observations: { polarity: LandscapeEvaluation["observations"][number]["polarity"]; topic: { slug: string; name: string } }[];
}): LandscapeEvaluation & { population: Population } {
  return {
    population: evaluation.population === "CRITIC" ? "CRITIC" : "AUDIENCE",
    lens: evaluation.lens,
    standard: evaluation.standard,
    enjoyment: evaluation.enjoyment,
    execution: evaluation.execution,
    completion: evaluation.completion,
    judgments: evaluation.judgments.map((judgment) => ({
      dimensionSlug: judgment.dimension.slug,
      dimensionName: judgment.dimension.name,
      stance: judgment.stance,
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

export type { CardWork, FullWork };
