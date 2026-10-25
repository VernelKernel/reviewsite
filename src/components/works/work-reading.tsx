"use client";

import { useState, type ReactNode } from "react";
import { hiddenVertexPoints, type Focus, type VertexPointSettings } from "@/components/evaluations/dimension-shape";
import { landscapeCardPopulations, renderLandscapeCard, scopeLabel } from "@/components/evaluations/landscape-card";
import { ReviewLandscapeView } from "@/components/evaluations/review-landscape";
import type { ReviewCardModel } from "@/components/reviews/review-card";
import { ShareBanner } from "@/components/share/share-banner";
import { ReceptionColumns } from "@/components/works/reception-columns";
import type { ReviewLandscape, ShapeMode } from "@/lib/aggregation/landscape";

export function WorkReading({
  critics,
  audience,
  totalEvaluations,
  clearHref,
  filteredNote,
  toolbar,
  share,
  card,
  criticReviews,
  audienceReviews,
  criticHref,
  audienceHref,
  children,
}: {
  critics: ReviewLandscape;
  audience: ReviewLandscape;
  totalEvaluations: number;
  clearHref: string;
  filteredNote?: string;
  toolbar?: ReactNode;
  share: { title: string; path: string };
  card: { kind: string; period: string | null; filters: string[]; coverSrc: string | null };
  criticReviews: ReviewCardModel[];
  audienceReviews: ReviewCardModel[];
  criticHref: string;
  audienceHref: string;
  children?: ReactNode;
}) {
  const [requestedMode, setMode] = useState<ShapeMode>("both");
  const [requestedFocus, setFocus] = useState<Focus | null>(null);
  const [vertexPoints, setVertexPoints] = useState<VertexPointSettings>(hiddenVertexPoints);
  const mode: ShapeMode =
    (requestedMode === "critics" && critics.sampleSize === 0) || (requestedMode === "audience" && audience.sampleSize === 0)
      ? "both"
      : requestedMode;
  const twoRows = mode === "both" && critics.sampleSize > 0 && audience.sampleSize > 0;
  const focus = twoRows ? requestedFocus : null;
  const scope: ShapeMode = focus ?? mode;
  const hasEvaluations = critics.sampleSize + audience.sampleSize > 0;
  const cardPopulations = landscapeCardPopulations(scope, critics, audience);
  const singleLabel = cardPopulations.length === 1 ? scopeLabel(cardPopulations[0]) : null;

  return (
    <>
      <ReviewLandscapeView
        critics={critics}
        audience={audience}
        mode={mode}
        onMode={(next) => {
          setMode(next);
          if (next !== "both") setFocus(null);
        }}
        focus={focus}
        onFocus={(population) => setFocus((current) => (current === population ? null : population))}
        totalEvaluations={totalEvaluations}
        clearHref={clearHref}
        filteredNote={filteredNote}
        toolbar={toolbar}
        share={share}
        vertexPoints={vertexPoints}
        onVertexPoints={setVertexPoints}
      />
      {hasEvaluations ? (
        <ShareBanner
          heading="Share this reading"
          body={
            singleLabel
              ? `Turn what these evaluations say into a card, then send the image. The card shows ${singleLabel}.`
              : "Critics and audience each get a card. Choose which image to download."
          }
          dialogHeading="Your share card"
          dialogNote={
            singleLabel
              ? `${singleLabel}, from published evaluations. Download it, or send it from here.`
              : "Each population has its own card, from published evaluations. Choose which image to download."
          }
          title={share.title}
          path={share.path}
          render={async () => {
            const images = [];
            for (const population of cardPopulations) {
              images.push({
                id: population,
                label: population === "critics" ? "Critics" : "Audience",
                file: await renderLandscapeCard({
                  title: share.title,
                  kind: card.kind,
                  url: `${window.location.origin}${share.path}`,
                  path: share.path,
                  host: window.location.host,
                  scope: population,
                  critics,
                  audience,
                  period: card.period,
                  filters: card.filters,
                  coverSrc: card.coverSrc,
                  showPoints: vertexPoints[population],
                }),
              });
            }
            return images;
          }}
        />
      ) : null}
      {children}
      <ReceptionColumns
        critics={criticReviews}
        audience={audienceReviews}
        criticHref={criticHref}
        audienceHref={audienceHref}
        show={scope}
      />
    </>
  );
}
