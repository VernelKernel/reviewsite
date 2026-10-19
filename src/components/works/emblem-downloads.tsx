"use client";

import { useState } from "react";
import { downloadCover, downloadEmblem, type EmblemReading } from "@/components/works/emblem-export";

export function EmblemDownloads({
  slug,
  artSrc,
  reading,
}: {
  slug: string;
  artSrc: string | null;
  reading: EmblemReading;
}) {
  const [pending, setPending] = useState<"emblem" | "cover" | null>(null);
  const [status, setStatus] = useState("");

  async function run(kind: "emblem" | "cover") {
    setPending(kind);
    setStatus("");
    try {
      if (kind === "emblem") await downloadEmblem(reading, slug);
      else if (artSrc) await downloadCover(reading, slug, artSrc);
    } catch {
      setStatus("Could not prepare the image.");
    } finally {
      setPending(null);
    }
  }

  return (
    <>
      <div className="emblem-downloads">
        <button
          type="button"
          className="btn btn-ghost emblem-download"
          aria-label="Download emblem"
          title="Download emblem"
          disabled={pending !== null}
          aria-busy={pending === "emblem"}
          onClick={() => void run("emblem")}
        >
          <EmblemIcon />
        </button>
        <button
          type="button"
          className="btn btn-ghost emblem-download"
          aria-label="Download cover with emblem"
          title="Download cover with emblem"
          disabled={pending !== null || !artSrc}
          aria-busy={pending === "cover"}
          onClick={() => void run("cover")}
        >
          <CoverIcon />
        </button>
      </div>
      {status ? (
        <p className="meta emblem-download-status" role="status">
          {status}
        </p>
      ) : null}
    </>
  );
}

function EmblemIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path fill="currentColor" d="M12 2.2 15.2 6.4 12 10.6 8.8 6.4Z" />
      <path fill="currentColor" d="M12 13.4 15.2 17.6 12 21.8 8.8 17.6Z" />
      <path fill="currentColor" d="M2.2 12 6.4 8.8 10.6 12 6.4 15.2Z" />
      <path fill="currentColor" d="M13.4 12 17.6 8.8 21.8 12 17.6 15.2Z" />
    </svg>
  );
}

function CoverIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="2.25" y="4.25" width="19.5" height="15.5" rx="1.5" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <path fill="currentColor" d="M15.6 12.8 19.1 16.3 15.6 19.8 12.1 16.3Z" />
    </svg>
  );
}
