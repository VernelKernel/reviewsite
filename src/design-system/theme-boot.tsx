"use client";

import { useRef } from "react";
import { useServerInsertedHTML } from "next/navigation";

export function ThemeBoot({ html }: { html: string }) {
  const inserted = useRef(false);

  useServerInsertedHTML(() => {
    if (inserted.current) return null;
    inserted.current = true;
    return <script dangerouslySetInnerHTML={{ __html: html }} />;
  });

  return null;
}
