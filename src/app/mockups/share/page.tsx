import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { splitLandscapes } from "@/lib/aggregation/landscape";
import { workHref, workTypeLabel } from "@/lib/domain/labels";
import { snapshotPeriod, toLandscapeInput, workArt } from "@/lib/works/present";
import { getWork } from "@/lib/works/queries";
import { ShareCardSample } from "./share-card-sample";

export const metadata: Metadata = {
  title: "Castlevania: Belmont's Curse share card",
  robots: { index: false, follow: false },
};

export default async function ShareMockupPage() {
  const work = await getWork("GAME", "castlevania-belmont-s-curse");
  if (!work) notFound();
  const art = workArt(work.media);
  const landscape = splitLandscapes(work.evaluations.map(toLandscapeInput));
  return (
    <main className="page shell mockup-sheet">
      <h1 className="sr-only">{work.title}</h1>
      <ShareCardSample
        title={work.title}
        kind={workTypeLabel[work.workType]}
        path={workHref(work.workType, work.slug)}
        period={snapshotPeriod(work.evaluations.map((evaluation) => evaluation.reviewedOn ?? evaluation.createdAt))}
        filters={[]}
        coverSrc={art.tall?.src ?? art.wide?.src ?? null}
        critics={landscape.critics}
        audience={landscape.audience}
      />
    </main>
  );
}
