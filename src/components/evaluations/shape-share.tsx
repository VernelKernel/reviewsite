"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { ReviewLandscape } from "@/lib/aggregation/landscape";
import { mailServices, networkTargets, shareSummary } from "@/lib/share/targets";
import { renderLandscapeCard, type ShareAxis } from "./landscape-card";

const ICONS: Record<string, string> = {
  x: "/share/x.png",
  reddit: "/share/reddit.png",
  bluesky: "/share/bluesky.png",
  pinterest: "/share/pinterest.png",
  facebook: "/share/facebook.png",
};

export function ShapeShare({
  title,
  path,
  axes,
  audience,
  critics,
  showAudience,
  showCritics,
}: {
  title: string;
  path: string;
  axes: ShareAxis[];
  audience: ReviewLandscape;
  critics: ReviewLandscape;
  showAudience: boolean;
  showCritics: boolean;
}) {
  const menuId = useId();
  const sendRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const cache = useRef<{ key: string; file: Promise<File> } | null>(null);
  const [origin, setOrigin] = useState("");
  const [open, setOpen] = useState(false);
  const [canSendImage, setCanSendImage] = useState(false);
  const [copyLabel, setCopyLabel] = useState("Copy link");
  const [pending, setPending] = useState<"download" | "image" | null>(null);
  const [status, setStatus] = useState("");

  useEffect(() => {
    setOrigin(window.location.origin);
    setCanSendImage(typeof navigator.share === "function");
  }, []);

  useEffect(() => {
    if (!open) return;
    const menu = menuRef.current;
    const first = menu?.querySelector<HTMLElement>("[role='menuitem']");
    first?.focus();
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        sendRef.current?.focus();
      }
    }
    function onPointer(event: PointerEvent) {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (menuRef.current?.contains(target) || sendRef.current?.contains(target)) return;
      setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointer);
    };
  }, [open]);

  const pageUrl = `${origin || ""}${path}`;
  const targets = networkTargets(origin ? pageUrl : path, title);
  const services = mailServices(origin ? pageUrl : path, title);

  function cardFile(): Promise<File> {
    const url = `${window.location.origin}${path}`;
    const key = `${path}|${showAudience}|${showCritics}|${audience.sampleSize}|${critics.sampleSize}|${url}`;
    if (cache.current?.key === key) return cache.current.file;
    const file = renderLandscapeCard({
      title,
      url,
      path,
      axes,
      audience,
      critics,
      showAudience,
      showCritics,
    }).catch((error: unknown) => {
      cache.current = null;
      throw error;
    });
    cache.current = { key, file };
    return file;
  }

  async function copyLink() {
    const url = `${window.location.origin}${path}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopyLabel("Copied");
      setStatus("Link copied");
    } catch {
      setCopyLabel("Copy link");
      setStatus(url);
    }
  }

  async function download() {
    setPending("download");
    setStatus("");
    try {
      await saveFile(await cardFile());
      setStatus("Image downloaded");
    } catch {
      setStatus("Could not prepare the image.");
    } finally {
      setPending(null);
    }
  }

  async function sendImage() {
    setPending("image");
    setStatus("");
    try {
      const file = await cardFile();
      const url = `${window.location.origin}${path}`;
      const text = `${shareSummary(title)}\n${url}`;
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title, text });
      } else if (navigator.share) {
        await navigator.share({ title, text, url });
      }
      setOpen(false);
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      try {
        await saveFile(await cardFile());
        setStatus("Image downloaded. Attach it to your message.");
      } catch {
        setStatus("Could not share the image.");
      }
    } finally {
      setPending(null);
    }
  }

  return (
    <div className="shape-share">
      <div className="share-actions" role="group" aria-label="Share this reading">
        {targets.map((target) => (
          <a
            key={target.id}
            className="share-hit"
            href={target.href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={target.label}
            data-tooltip={target.label}
          >
            <img src={ICONS[target.id]} alt="" width={32} height={32} draggable={false} />
          </a>
        ))}
        <div className="share-send">
          <button
            ref={sendRef}
            className="share-hit"
            type="button"
            aria-label="Send"
            aria-haspopup="menu"
            aria-expanded={open}
            aria-controls={menuId}
            data-tooltip="Send"
            onClick={() => setOpen((value) => !value)}
          >
            <img src="/share/send.png" alt="" width={32} height={32} draggable={false} />
          </button>
          {open ? (
            <div ref={menuRef} id={menuId} className="share-menu" role="menu" aria-label="Send">
              {canSendImage ? (
                <button type="button" role="menuitem" disabled={pending === "image"} aria-busy={pending === "image"} onClick={() => void sendImage()}>
                  Send image
                </button>
              ) : null}
              {services.map((service) => (
                <a
                  key={service.id}
                  role="menuitem"
                  href={service.href}
                  target={service.href.startsWith("mailto:") ? undefined : "_blank"}
                  rel="noopener noreferrer"
                  onClick={() => setOpen(false)}
                >
                  {service.label}
                </a>
              ))}
            </div>
          ) : null}
        </div>
        <button className="share-hit" type="button" aria-label={copyLabel} data-tooltip={copyLabel} onClick={() => void copyLink()}>
          <img src="/share/copy-link.png" alt="" width={32} height={32} draggable={false} />
        </button>
      </div>
      <button
        className="share-hit share-download"
        type="button"
        aria-label="Download image"
        data-tooltip="Download image"
        aria-busy={pending === "download"}
        disabled={pending === "download"}
        onClick={() => void download()}
        onMouseEnter={() => void cardFile().catch(() => undefined)}
      >
        <img src="/share/download.png" alt="" width={32} height={32} draggable={false} />
      </button>
      <p className="share-status" role="status">
        {status}
      </p>
    </div>
  );
}

function saveFile(file: File) {
  const href = URL.createObjectURL(file);
  const anchor = document.createElement("a");
  anchor.href = href;
  anchor.download = file.name;
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(href), 1500);
}
