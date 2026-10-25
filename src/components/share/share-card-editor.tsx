"use client";

import { useEffect, useId, useState, type RefObject } from "react";
import { SHARE_ICONS, saveFile, saveFiles } from "@/components/share/share-assets";
import { networkTargets, shareSummary, type ShareTarget } from "@/lib/share/targets";

export type ShareCardImage = {
  id: string;
  label: string;
  file: File;
};

export function ShareCardEditor({
  dialogRef,
  heading,
  note,
  title,
  path,
  cards,
  onClose,
}: {
  dialogRef: RefObject<HTMLDialogElement | null>;
  heading: string;
  note: string;
  title: string;
  path: string;
  cards: Array<ShareCardImage & { preview: string }>;
  onClose: () => void;
}) {
  const headingId = useId();
  const [origin] = useState(() => (typeof window === "undefined" ? "" : window.location.origin));
  const [selectedId, setSelectedId] = useState(cards[0]?.id ?? "");
  const [canShareFile, setCanShareFile] = useState(false);
  const [canCopyImage] = useState(
    () =>
      typeof window !== "undefined" &&
      typeof ClipboardItem !== "undefined" &&
      typeof navigator.clipboard?.write === "function",
  );
  const [status, setStatus] = useState("");
  const selected = cards.find((card) => card.id === selectedId) ?? cards[0] ?? null;
  const file = selected?.file ?? null;
  const several = cards.length > 1;

  useEffect(() => {
    setStatus("");
    setSelectedId(cards[0]?.id ?? "");
  }, [cards]);

  useEffect(() => {
    setCanShareFile(Boolean(file && typeof navigator.canShare === "function" && navigator.canShare({ files: [file] })));
  }, [file]);

  const url = `${origin}${path}`;
  const targets = networkTargets(origin ? url : path, title);
  const selectedName = selected ? selected.label.toLowerCase() : "image";

  function downloadSelected() {
    if (!file || !selected) return;
    saveFile(file);
    setStatus(several ? `${selected.label} image downloaded` : "Image downloaded");
  }

  function downloadAll() {
    const files = cards.map((card) => card.file);
    if (files.length === 0) return;
    saveFiles(files);
    setStatus(files.length > 1 ? "Both images downloaded" : "Image downloaded");
  }

  async function copyImage() {
    if (!file || !selected) return;
    try {
      await navigator.clipboard.write([new ClipboardItem({ [file.type]: file })]);
      setStatus(several ? `${selected.label} image copied. Paste it where you share.` : "Image copied. Paste it where you share.");
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
      setStatus(several ? `${selected?.label ?? "Image"} image downloaded. Attach it where you share.` : "Image downloaded. Attach it where you share.");
    }
  }

  function post(target: ShareTarget) {
    if (!file || !selected) return;
    saveFile(file);
    window.open(target.href, "_blank", "noopener,noreferrer");
    setStatus(
      several
        ? `${selected.label} image downloaded. Attach it to the post that just opened.`
        : "Image downloaded. Attach it to the post that just opened.",
    );
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
      {several ? (
        <div className="share-card-choice shape-segment" role="radiogroup" aria-label="Which card to save">
          {cards.map((card) => (
            <button
              key={card.id}
              type="button"
              role="radio"
              aria-checked={card.id === selected?.id}
              onClick={() => {
                setSelectedId(card.id);
                setStatus("");
              }}
            >
              {card.label}
            </button>
          ))}
        </div>
      ) : null}
      {selected ? <img src={selected.preview} alt={`Share card for ${title}, ${selected.label}`} /> : null}
      <div className="share-card-actions" role="group" aria-label="Save the image">
        <button className="btn btn-primary" type="button" disabled={!file} onClick={downloadSelected}>
          {several ? `Download ${selectedName} image` : "Download image"}
        </button>
        {several ? (
          <button className="btn btn-secondary" type="button" onClick={downloadAll}>
            Download both
          </button>
        ) : null}
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
        <div className="share-actions" role="group" aria-label="Post with the image">
          {targets.map((target) => (
            <button
              key={target.id}
              className="share-hit"
              type="button"
              disabled={!file}
              aria-label={
                several
                  ? `Download ${selectedName} image and ${target.label.replace(/^Share/, "share")}`
                  : `Download image and ${target.label.replace(/^Share/, "share")}`
              }
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
