import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ReviewEmblem } from "@/components/evaluations/review-emblem";
import { prisma } from "@/lib/db/client";
import { landscapesFor } from "@/lib/works/present";
import { cardInclude } from "@/lib/works/queries";

export const metadata: Metadata = {
  title: "Dark of the Depths emblem",
  robots: { index: false, follow: false },
};

export default async function EmblemMockupPage() {
  const work = await prisma.work.findUnique({
    where: { workType_slug: { workType: "GAME", slug: "dark-of-the-depths" } },
    include: cardInclude,
  });
  if (!work) notFound();
  const landscapes = landscapesFor(work);

  return (
    <main className="page shell mockup-sheet emblem-sheet">
      <h1 className="sr-only">{work.title}</h1>
      <ReviewEmblem
        critics={{ enjoyment: landscapes.critics.enjoyment, execution: landscapes.critics.execution }}
        audience={{ enjoyment: landscapes.audience.enjoyment, execution: landscapes.audience.execution }}
      />
    </main>
  );
}
