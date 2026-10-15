"use client";

import { useEffect, useState } from "react";
import { CompareButton } from "@/components/comparison/compare-controls";
import { detailsHref } from "@/lib/domain/labels";

export function WorkNav({ workType, slug, title }: { workType: string; slug: string; title: string }) {
  const [hash, setHash] = useState("");

  useEffect(() => {
    const apply = () => setHash(window.location.hash);
    apply();
    window.addEventListener("hashchange", apply);
    return () => window.removeEventListener("hashchange", apply);
  }, []);

  const reviews = hash === "#reviews";

  return (
    <nav className="evaluation-nav" aria-label="On this work">
      <a href="#overview" aria-current={reviews ? undefined : "location"} onClick={() => setHash("#overview")}>
        Overview
      </a>
      <a href={detailsHref(workType, slug)}>Details</a>
      <a href="#reviews" aria-current={reviews ? "location" : undefined} onClick={() => setHash("#reviews")}>
        Related reviews
      </a>
      <CompareButton appearance="nav" workType={workType} slug={slug} title={title} />
    </nav>
  );
}
