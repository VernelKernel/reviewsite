"use client";

import { useEffect, useRef, useState } from "react";

const FOLDS_BEFORE_VISIBLE = 2;

export function ScrollToTop() {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    let observed: Element | null = null;

    const measureTray = () => {
      const tray = document.querySelector(".compare-tray");
      if (tray instanceof HTMLElement) {
        root.style.setProperty("--compare-tray-offset", `${tray.offsetHeight}px`);
        if (observed !== tray) {
          if (observed) trayObserver.unobserve(observed);
          trayObserver.observe(tray);
          observed = tray;
        }
        return;
      }
      root.style.removeProperty("--compare-tray-offset");
      if (observed) trayObserver.unobserve(observed);
      observed = null;
    };

    const trayObserver = new ResizeObserver(measureTray);
    measureTray();
    const mutations = new MutationObserver(measureTray);
    mutations.observe(document.body, { childList: true });
    window.addEventListener("resize", measureTray);
    return () => {
      mutations.disconnect();
      trayObserver.disconnect();
      window.removeEventListener("resize", measureTray);
      root.style.removeProperty("--compare-tray-offset");
    };
  }, []);

  useEffect(() => {
    let frame = 0;

    const update = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const next = window.scrollY >= window.innerHeight * FOLDS_BEFORE_VISIBLE;
        setVisible((current) => (current === next ? current : next));
        if (!next && document.activeElement === buttonRef.current) {
          buttonRef.current.blur();
        }
      });
    };

    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  function backToTop() {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
  }

  return (
    <button
      ref={buttonRef}
      type="button"
      className="scroll-top"
      data-visible={visible ? "true" : "false"}
      aria-label="Back to top"
      aria-hidden={visible ? undefined : true}
      tabIndex={visible ? undefined : -1}
      onClick={backToTop}
    >
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path
          d="M12 19V6M6.5 11.5 12 6l5.5 5.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}
