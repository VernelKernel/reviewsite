"use client";

import { useEffect, useId, useState, type RefObject } from "react";
import { SHARE_ICONS, saveFile } from "@/components/share/share-assets";
import { networkTargets, shareSummary, type ShareTarget } from "@/lib/share/targets";

export function ShareCardEditor({
  dialogRef,
  heading,
  note,
  title,
  path,
  file,
  preview,
  onClose,
}: {
  dialogRef: RefObject<HTMLDialogElement | null>;
  heading: string;
  note: string;
  title: string;
  path: string;
  file: File | null;
  preview: string | null;
  onClose: () => void;
}) {
  const headingId = useId();
  const [origin] = useState(() => (typeof window === "undefined" ? "" : window.location.origin));
  const [canShareFile, setCanShareFile] = useState(false);
  const [canCopyImage] = useState(
    () =>
      typeof window !== "undefined" &&
      typeof ClipboardItem !== "undefined" &&
      typeof navigator.clipboard?.write === "function",
  );
  const [status, setStatus] = useState("");

  useEffect(() => {
    setStatus("");
    setCanShareFile(Boolean(file && typeof navigator.canShare === "function" && navigator.canShare({ files: [file] })));
  }, [file]);

  const url = `${origin}${path}`;
  const targets = networkTargets(origin ? url : path, title);

  function download() {
    if (!file) return;
    saveFile(file);
    setStatus("Image downloaded");
  }

  async function copyImage() {
    if (!file) return;
    try {
      await navigator.clipboard.write([new ClipboardItem({ [file.type]: file })]);
      setStatus("Image copied. Paste it where you share.");
    } catch {
      setStatus("This browser would not copy the image. Download it instead.");
    }
  }

  async function shareImage() {
    if (!file) return;
    try {
      await navigator.share({ files: [file], title, text: `${shareSummary(title)}\n${url}` });
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      saveFile(file);
      setStatus("Image downloaded. Attach it where you share.");
    }
  }

  function post(target: ShareTarget) {
    if (!file) return;
    saveFile(file);
    window.open(target.href, "_blank", "noopener,noreferrer");
    setStatus("Image downloaded. Attach it to the post that just opened.");
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url);
      setStatus("Link copied");
    } catch {
      setStatus(url);
    }
  }

  return (
    <dialog ref={dialogRef} className="share-card-dialog" aria-labelledby={headingId} onClose={onClose}>
      <h2 id={headingId}>{heading}</h2>
      <p className="meta">{note}</p>
      {preview ? <img src={preview} alt={`Share card for ${title}`} /> : null}
      <div className="share-card-actions" role="group" aria-label="Save the image">
        <button className="btn btn-primary" type="button" disabled={!file} onClick={download}>
          Download image
        </button>
        {canCopyImage ? (
          <button className="btn btn-secondary" type="button" disabled={!file} onClick={() => void copyImage()}>
            Copy image
          </button>
        ) : null}
        {canShareFile ? (
          <button className="btn btn-secondary" type="button" disabled={!file} onClick={() => void shareImage()}>
            Share image
          </button>
        ) : null}
      </div>
      <div className="share-card-post">
        <p className="meta">These sites cannot take an image from a link. Each button downloads the card, then opens a post with the page link.</p>
        <div className="share-actions" role="group" aria-label="Post with the image">
          {targets.map((target) => (
            <button
              key={target.id}
              className="share-hit"
              type="button"
              disabled={!file}
              aria-label={`Download image and ${target.label.replace(/^Share/, "share")}`}
              data-tooltip={target.label}
              onClick={() => post(target)}
            >
              <img src={SHARE_ICONS[target.id]} alt="" width={32} height={32} draggable={false} />
            </button>
          ))}
        </div>
      </div>
      <div className="share-card-actions">
        <button className="btn btn-secondary" type="button" onClick={() => void copyLink()}>
          Copy link
        </button>
        <button className="btn btn-secondary" type="button" onClick={() => dialogRef.current?.close()}>
          Close
        </button>
      </div>
      <p className="meta" role="status">
        {status}
      </p>
    </dialog>
  );
}
