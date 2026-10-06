import type { MetadataRoute } from "next";
import { audienceHref, criticsHref, detailsHref, workHref } from "@/lib/domain/labels";
import { listWorks } from "@/lib/works/queries";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const works = await listWorks();
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  return [
    { url: base, changeFrequency: "daily", priority: 1 },
    { url: `${base}/games`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${base}/discover`, changeFrequency: "daily", priority: 0.7 },
    { url: `${base}/about`, changeFrequency: "monthly", priority: 0.4 },
    ...works.flatMap((work) => [
      {
        url: `${base}${workHref(work.workType, work.slug)}`,
        changeFrequency: "weekly" as const,
        priority: 0.9,
      },
      {
        url: `${base}${criticsHref(work.workType, work.slug)}`,
        changeFrequency: "weekly" as const,
        priority: 0.6,
      },
      {
        url: `${base}${audienceHref(work.workType, work.slug)}`,
        changeFrequency: "weekly" as const,
        priority: 0.6,
      },
      {
        url: `${base}${detailsHref(work.workType, work.slug)}`,
        changeFrequency: "weekly" as const,
        priority: 0.5,
      },
    ]),
  ];
}
