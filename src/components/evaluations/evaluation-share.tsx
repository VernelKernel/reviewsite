"use client";

import { useEffect, useId, useRef, useState } from "react";
import { shareSummary } from "@/lib/share/targets";
import { renderEvaluationCard, type EvaluationCardInput } from "./evaluation-card";

export function EvaluationShare({ card }: { card: Omit<EvaluationCardInput, "host"> }) {
  const titleId = useId();
  const dialogTitleId = useId();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const previewUrl = useRef<string | null>(null);
  const [pending, setPending] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState("");
  const [canShare, setCanShare] = useState(false);

  useEffect(() => {
    setCanShare(typeof navigator.share === "function");
  }, []);

  useEffect(() => {
    return () => {
      if (previewUrl.current) URL.revokeObjectURL(previewUrl.current);
    };
  }, []);

  async function createCard() {
    setPending(true);
    setStatus("");
    try {
      const next = await renderEvaluationCard({ ...card, host: window.location.host });
      if (previewUrl.current) URL.revokeObjectURL(previewUrl.current);
      const url = URL.createObjectURL(next);
      previewUrl.current = url;
      setFile(next);
      setPreview(url);
      setCanShare(typeof navigator.share === "function");
      const dialog = dialogRef.current;
      if (dialog?.open) dialog.close();
      dialog?.showModal();
    } catch {
      setStatus("Could not prepare the card.");
    } finally {
      setPending(false);
    }
  }

  function close() {
    dialogRef.current?.close();
    buttonRef.current?.focus();
  }

  async function download() {
    if (!file) return;
    saveFile(file);
    setStatus("Image downloaded");
  }

  async function send() {
    if (!file) return;
    const url = `${window.location.origin}${card.path}`;
    const text = `${shareSummary(card.title)}\n${url}`;
    try {
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: card.title, text });
      } else if (navigator.share) {
        await navigator.share({ title: card.title, text, url });
      } else {
        saveFile(file);
        setStatus("Image downloaded. Attach it where you share.");
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      saveFile(file);
      setStatus("Image downloaded. Attach it where you share.");
    }
  }

  async function copyLink() {
    const url = `${window.location.origin}${card.path}`;
    try {
      await navigator.clipboard.writeText(url);
      setStatus("Link copied");
    } catch {
      setStatus(url);
    }
  }

  return (
    <section className="share-banner" aria-labelledby={titleId}>
      <div>
        <h2 id={titleId}>Share your take</h2>
        <p>Turn this evaluation into a card, then send the image.</p>
      </div>
      <button ref={buttonRef} className="btn share-banner-action" type="button" disabled={pending} aria-busy={pending} onClick={() => void createCard()}>
        {pending ? "Preparing card…" : "Create share card"}
      </button>
      {status ? <p className="share-banner-status" role="status">{status}</p> : null}
      <dialog ref={dialogRef} className="share-card-dialog" aria-labelledby={dialogTitleId} onClose={() => buttonRef.current?.focus()}>
        <h2 id={dialogTitleId}>Your share card</h2>
        <p className="meta">The image is ready. Download it, or send it from here.</p>
        {preview ? <img src={preview} alt={`Share card for ${card.title}`} /> : null}
        <div className="share-card-actions">
          <button className="btn btn-secondary" type="button" onClick={() => void download()}>
            Download
          </button>
          {canShare ? (
            <button className="btn btn-primary" type="button" onClick={() => void send()}>
              Share image
            </button>
          ) : null}
          <button className="btn btn-secondary" type="button" onClick={() => void copyLink()}>
            Copy link
          </button>
          <button className="btn btn-secondary" type="button" onClick={close}>
            Close
          </button>
        </div>
        {status ? <p className="meta" role="status">{status}</p> : null}
      </dialog>
    </section>
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
