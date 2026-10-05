"use client";

import { useState } from "react";

export function CopyLink({ path }: { path: string }) {
  const [label, setLabel] = useState("Copy link");

  async function copy() {
    const url = `${window.location.origin}${path}`;
    try {
      await navigator.clipboard.writeText(url);
      setLabel("Copied");
    } catch {
      setLabel(url);
    }
  }

  return (
    <button className="btn btn-secondary" type="button" onClick={() => void copy()}>
      {label}
    </button>
  );
}
