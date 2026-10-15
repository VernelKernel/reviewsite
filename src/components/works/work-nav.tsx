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
        <i className="flair-icon" data-icon="overview" aria-hidden="true" />
        Overview
      </a>
      <a href={detailsHref(workType, slug)}>
        <i className="flair-icon" data-icon="list" aria-hidden="true" />
        Details
      </a>
      <a href="#reviews" aria-current={reviews ? "location" : undefined} onClick={() => setHash("#reviews")}>
        <i className="flair-icon" data-icon="speech" aria-hidden="true" />
        Related reviews
      </a>
      <CompareButton appearance="nav" workType={workType} slug={slug} title={title} />
    </nav>
  );
}
