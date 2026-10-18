"use client";

import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { usePathname } from "next/navigation";
import { logout } from "@/lib/auth/actions";

const browse = [
  { href: "/games", label: "Games" },
  { href: "/discover", label: "Discover" },
  { href: "/about", label: "About" },
];

export type SiteMenuAccount = {
  displayName: string;
  reviewerSlug: string | null;
  editor: boolean;
};

export function SiteMenu({ account }: { account: SiteMenuAccount | null }) {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  const pathname = usePathname();

  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const panel = panelRef.current;
    panel?.querySelector<HTMLElement>("a, button")?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setOpen(false);
        return;
      }
      if (event.key !== "Tab" || !panel) return;
      const items = [...panel.querySelectorAll<HTMLElement>("a, button")].filter((item) => !item.hasAttribute("disabled"));
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = overflow;
      document.removeEventListener("keydown", onKey);
      (previous ?? buttonRef.current)?.focus();
    };
  }, [open]);

  return (
    <>
      <button
        ref={buttonRef}
        className="btn btn-secondary"
        type="button"
        aria-expanded={open}
        aria-controls="site-nav-drawer"
        onClick={() => setOpen(true)}
      >
        Menu
      </button>
      {open
        ? createPortal(
            <div className="nav-drawer-root">
              <button className="nav-drawer-backdrop" type="button" aria-label="Close menu" onClick={() => setOpen(false)} />
              <aside
                id="site-nav-drawer"
                className="nav-drawer"
                role="dialog"
                aria-modal="true"
                aria-labelledby={titleId}
                ref={panelRef}
              >
                <div className="nav-drawer-head">
                  <p id={titleId} className="nav-drawer-label">
                    Menu
                  </p>
                  <button className="btn btn-ghost" type="button" onClick={() => setOpen(false)}>
                    Close
                  </button>
                </div>
                <nav className="nav-drawer-section" aria-label="Browse">
                  <p className="nav-drawer-label">Browse</p>
                  {browse.map((link) => (
                    <a key={link.href} className="nav-drawer-link" href={link.href} aria-current={pathname.startsWith(link.href) ? "page" : undefined}>
                      {link.label}
                    </a>
                  ))}
                </nav>
                <div className="nav-drawer-section">
                  <p className="nav-drawer-label">Account</p>
                  {account ? (
                    <>
                      <p className="meta">{account.displayName}</p>
                      <a className="nav-drawer-link" href="/dashboard" aria-current={pathname.startsWith("/dashboard") ? "page" : undefined}>
                        Dashboard
                      </a>
                      {account.reviewerSlug ? (
                        <a className="nav-drawer-link" href={`/reviewers/${account.reviewerSlug}`}>
                          Public profile
                        </a>
                      ) : null}
                      <a className="nav-drawer-link" href="/settings" aria-current={pathname.startsWith("/settings") ? "page" : undefined}>
                        Settings
                      </a>
                      {account.editor ? (
                        <>
                          <a className="nav-drawer-link" href="/admin/outlets" aria-current={pathname.startsWith("/admin/outlets") ? "page" : undefined}>
                            Outlets
                          </a>
                          <a
                            className="nav-drawer-link"
                            href="/admin/email-preview"
                            aria-current={pathname.startsWith("/admin/email-preview") ? "page" : undefined}
                          >
                            Email preview
                          </a>
                        </>
                      ) : null}
                      <form action={logout}>
                        <button className="btn btn-secondary" type="submit">
                          Log out
                        </button>
                      </form>
                    </>
                  ) : (
                    <>
                      <a className="nav-drawer-link" href="/login">
                        Sign in
                      </a>
                      <a className="btn btn-primary" href="/signup">
                        Sign up
                      </a>
                    </>
                  )}
                </div>
              </aside>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
