"use client";

import { useEffect, useId, useRef, useState } from "react";
import { SHARE_ICONS } from "@/components/share/share-assets";
import { mailServices, networkTargets, shareSummary } from "@/lib/share/targets";

export function ShapeShare({ title, path }: { title: string; path: string }) {
  const menuId = useId();
  const sendRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [origin, setOrigin] = useState("");
  const [open, setOpen] = useState(false);
  const [canShare, setCanShare] = useState(false);
  const [copyLabel, setCopyLabel] = useState("Copy link");
  const [status, setStatus] = useState("");

  useEffect(() => {
    setOrigin(window.location.origin);
    setCanShare(typeof navigator.share === "function");
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

  async function nativeShare() {
    const url = `${window.location.origin}${path}`;
    try {
      await navigator.share({ title, text: shareSummary(title), url });
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      setStatus("Could not open the share sheet.");
    }
  }

  return (
    <div className="shape-share">
      <div className="share-actions" role="group" aria-label="Share this page">
        {canShare ? (
          <button className="btn btn-secondary share-native" type="button" onClick={() => void nativeShare()}>
            Share…
          </button>
        ) : null}
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
            <img src={SHARE_ICONS[target.id]} alt="" width={32} height={32} draggable={false} />
          </a>
        ))}
        <div className="share-send">
          <button
            ref={sendRef}
            className="share-hit"
            type="button"
            aria-label="Send by email"
            aria-haspopup="menu"
            aria-expanded={open}
            aria-controls={menuId}
            data-tooltip="Send by email"
            onClick={() => setOpen((value) => !value)}
          >
            <img src="/share/send.png" alt="" width={32} height={32} draggable={false} />
          </button>
          {open ? (
            <div ref={menuRef} id={menuId} className="share-menu" role="menu" aria-label="Send by email">
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
      <p className="share-status" role="status">
        {status}
      </p>
    </div>
  );
}
