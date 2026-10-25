"use client";

import { useEffect, useState } from "react";
import { landscapeCardPopulations, renderLandscapeCard } from "@/components/evaluations/landscape-card";
import type { ReviewLandscape } from "@/lib/aggregation/landscape";

export function ShareCardSample({
  title,
  kind,
  path,
  period,
  filters,
  coverSrc,
  critics,
  audience,
}: {
  title: string;
  kind: string;
  path: string;
  period: string | null;
  filters: string[];
  coverSrc: string | null;
  critics: ReviewLandscape;
  audience: ReviewLandscape;
}) {
  const [images, setImages] = useState<{ label: string; src: string }[]>([]);
  const [status, setStatus] = useState("Preparing cards…");

  useEffect(() => {
    let active = true;
    const urls: string[] = [];
    const populations = landscapeCardPopulations("both", critics, audience);
    Promise.all(
      populations.map(async (population) => {
        const file = await renderLandscapeCard({
          title,
          kind,
          path,
          period,
          filters,
          coverSrc,
          critics,
          audience,
          scope: population,
          host: window.location.host,
          url: `${window.location.origin}${path}`,
        });
        const src = URL.createObjectURL(file);
        urls.push(src);
        return { label: population === "critics" ? "Critics" : "Audience", src };
      }),
    )
      .then((ready) => {
        if (!active) {
          for (const url of urls) URL.revokeObjectURL(url);
          return;
        }
        setImages(ready);
        if (ready.length === 0) setStatus("No published evaluations to put on a card.");
      })
      .catch(() => {
        if (active) setStatus("Could not prepare the card.");
      });
    return () => {
      active = false;
      for (const url of urls) URL.revokeObjectURL(url);
    };
  }, [audience, critics, coverSrc, filters, kind, path, period, title]);

  return (
    <section className="mockup-frame" aria-label="Share cards" aria-busy={images.length === 0 ? true : undefined}>
      {images.length > 0 ? (
        images.map((image) => (
          <figure key={image.label}>
            <figcaption className="meta">{image.label}</figcaption>
            <img src={image.src} alt={`${image.label} share card for ${title}`} />
          </figure>
        ))
      ) : (
        <p className="meta">{status}</p>
      )}
    </section>
  );
}
