"use client";

import { useEffect, useId, useRef, useState } from "react";
import { ShareCardEditor, type ShareCardImage } from "@/components/share/share-card-editor";

export function ShareBanner({
  heading,
  body,
  dialogHeading,
  dialogNote,
  title,
  path,
  render,
}: {
  heading: string;
  body: string;
  dialogHeading: string;
  dialogNote: string;
  title: string;
  path: string;
  render: () => Promise<File | ShareCardImage[]>;
}) {
  const headingId = useId();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const previewUrls = useRef<string[]>([]);
  const [pending, setPending] = useState(false);
  const [cards, setCards] = useState<Array<ShareCardImage & { preview: string }>>([]);
  const [status, setStatus] = useState("");
  const [editorOpen, setEditorOpen] = useState(false);

  useEffect(() => {
    return () => {
      for (const url of previewUrls.current) URL.revokeObjectURL(url);
    };
  }, []);

  useEffect(() => {
    if (!editorOpen) return;
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) dialog.showModal();
  }, [editorOpen]);

  async function create() {
    setPending(true);
    setStatus("");
    try {
      const rendered = await render();
      const images = Array.isArray(rendered) ? rendered : [{ id: "card", label: "Image", file: rendered }];
      if (images.length === 0) throw new Error("No card to prepare.");
      for (const url of previewUrls.current) URL.revokeObjectURL(url);
      const ready = images.map((image) => {
        const preview = URL.createObjectURL(image.file);
        return { ...image, preview };
      });
      previewUrls.current = ready.map((image) => image.preview);
      setCards(ready);
      setEditorOpen(true);
    } catch {
      setStatus("Could not prepare the card.");
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="share-banner" aria-labelledby={headingId}>
      <div>
        <h2 id={headingId}>{heading}</h2>
        <p>{body}</p>
      </div>
      <button
        ref={buttonRef}
        className="btn share-banner-action"
        type="button"
        disabled={pending}
        aria-busy={pending}
        onClick={() => void create()}
      >
        {pending ? "Preparing card…" : "Create share card"}
      </button>
      {status ? (
        <p className="share-banner-status" role="status">
          {status}
        </p>
      ) : null}
      {editorOpen ? (
        <ShareCardEditor
          dialogRef={dialogRef}
          heading={dialogHeading}
          note={dialogNote}
          title={title}
          path={path}
          cards={cards}
          onClose={() => {
            setEditorOpen(false);
            buttonRef.current?.focus();
          }}
        />
      ) : null}
    </section>
  );
}
