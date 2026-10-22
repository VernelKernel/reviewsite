"use client";

import { useEffect, useState } from "react";
import { renderLandscapeCard } from "@/components/evaluations/landscape-card";
import { belmontCard, belmontLandscapes } from "./belmonts-curse";

export function ShareCardSample({ coverSrc }: { coverSrc: string | null }) {
  const [src, setSrc] = useState<string | null>(null);
  const [status, setStatus] = useState("Preparing card…");

  useEffect(() => {
    let active = true;
    let url: string | null = null;
    const { critics, audience } = belmontLandscapes();
    renderLandscapeCard({
      ...belmontCard,
      scope: "both",
      critics,
      audience,
      coverSrc,
    })
      .then((file) => {
        url = URL.createObjectURL(file);
        if (!active) {
          URL.revokeObjectURL(url);
          return;
        }
        setSrc(url);
      })
      .catch(() => {
        if (active) setStatus("Could not prepare the card.");
      });
    return () => {
      active = false;
      if (url) URL.revokeObjectURL(url);
    };
  }, [coverSrc]);

  return (
    <section className="mockup-frame" aria-label="Share card" aria-busy={src ? undefined : true}>
      {src ? (
        <img src={src} alt={`Share card for ${belmontCard.title}`} />
      ) : (
        <p className="meta">{status}</p>
      )}
    </section>
  );
}
