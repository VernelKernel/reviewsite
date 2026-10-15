"use client";

import { useEffect, useId, useRef, useState } from "react";
import { ShareCardEditor } from "@/components/share/share-card-editor";

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
  render: () => Promise<File>;
}) {
  const headingId = useId();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const previewUrl = useRef<string | null>(null);
  const [pending, setPending] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [status, setStatus] = useState("");

  useEffect(() => {
    return () => {
      if (previewUrl.current) URL.revokeObjectURL(previewUrl.current);
    };
  }, []);

  async function create() {
    setPending(true);
    setStatus("");
    try {
      const next = await render();
      if (previewUrl.current) URL.revokeObjectURL(previewUrl.current);
      const url = URL.createObjectURL(next);
      previewUrl.current = url;
      setFile(next);
      setPreview(url);
      const dialog = dialogRef.current;
      if (dialog?.open) dialog.close();
      dialog?.showModal();
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
      <ShareCardEditor
        dialogRef={dialogRef}
        heading={dialogHeading}
        note={dialogNote}
        title={title}
        path={path}
        file={file}
        preview={preview}
        onClose={() => buttonRef.current?.focus()}
      />
    </section>
  );
}
