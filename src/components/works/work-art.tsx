import type { WorkArt } from "@/lib/works/present";

export function ArtImage({
  art,
  shape,
  className,
  decorative = false,
}: {
  art: WorkArt;
  shape: "wide" | "tall";
  className?: string;
  decorative?: boolean;
}) {
  const match = art[shape];
  const image = match ?? art[shape === "wide" ? "tall" : "wide"];
  if (!image) return null;
  return <img className={className} src={image.src} alt={decorative ? "" : image.alt} data-fit={match ? "cover" : "contain"} />;
}

export function HeroArt({ art, className }: { art: WorkArt; className?: string }) {
  return (
    <div className={className ? `key-art-frame ${className}` : "key-art-frame"} data-art={art.wide && art.tall ? "both" : undefined}>
      {art.tall ? <img className="key-art" data-shape="tall" src={art.tall.src} alt={art.tall.alt} /> : null}
      {art.wide ? <img className="key-art" data-shape="wide" src={art.wide.src} alt={art.wide.alt} /> : null}
      {!art.wide && !art.tall ? <div className="key-art" /> : null}
    </div>
  );
}
