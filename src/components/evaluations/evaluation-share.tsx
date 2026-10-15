"use client";

import { ShareBanner } from "@/components/share/share-banner";
import { renderEvaluationCard, type EvaluationCardInput } from "./evaluation-card";

export function EvaluationShare({ card }: { card: Omit<EvaluationCardInput, "host"> }) {
  return (
    <ShareBanner
      heading="Share your take"
      body="Turn this evaluation into a card, then send the image."
      dialogHeading="Your share card"
      dialogNote="The image is ready. Download it, or send it from here."
      title={card.title}
      path={card.path}
      render={() => renderEvaluationCard({ ...card, host: window.location.host })}
    />
  );
}
