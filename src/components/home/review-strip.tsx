"use client";

import { useEffect, useRef, useState } from "react";
import { stanceClass, stanceLabel } from "@/lib/domain/labels";

export type HomeReviewCard = {
  href: string;
  title: string;
  typeLabel: string;
  year: number | null;
  reviewerName: string;
  artSrc: string | null;
  enjoyment: string;
  execution: string;
};

export function HomeReviewStrip({ reviews }: { reviews: HomeReviewCard[] }) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [canNext, setCanNext] = useState(false);

  useEffect(() => {
    const node = scrollerRef.current;
    if (!node) return;
    const update = () => {
      setCanNext(node.scrollLeft + node.clientWidth < node.scrollWidth - 2);
    };
    update();
    node.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    const observer = new ResizeObserver(update);
    observer.observe(node);
    return () => {
      node.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
      observer.disconnect();
    };
  }, [reviews.length]);

  function next() {
    const node = scrollerRef.current;
    if (!node) return;
    const card = node.querySelector<HTMLElement>(".home-review-card");
    const styles = getComputedStyle(node);
    const gap = Number.parseFloat(styles.columnGap || styles.gap) || 0;
    const amount = card ? card.getBoundingClientRect().width + gap : node.clientWidth * 0.8;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    node.scrollBy({ left: amount, behavior: reduce ? "auto" : "smooth" });
  }

  return (
    <section className="home-recent" aria-labelledby="recent-reviews">
      <div className="home-recent-head">
        <h2 id="recent-reviews">Recent reviews</h2>
        <a className="home-browse" href="/games">
          Browse all works <span aria-hidden="true">→</span>
        </a>
      </div>
      <div className="home-recent-frame">
        <div className="home-recent-scroller" ref={scrollerRef} tabIndex={0} aria-labelledby="recent-reviews">
          {reviews.map((review) => {
            const meta = [review.typeLabel, review.year, review.reviewerName].filter((part) => part !== null && part !== "").join(" · ");
            return (
              <a className="home-review-card" key={review.href} href={review.href}>
                <div className="home-review-media">
                  {review.artSrc ? <img src={review.artSrc} alt="" /> : null}
                </div>
                <div className="home-review-body">
                  <h3>{review.title}</h3>
                  <p className="meta">{meta}</p>
                  <p className="home-review-stance">
                    <span>Enjoyment</span>
                    <span className={stanceClass(review.enjoyment)}>{stanceLabel[review.enjoyment]}</span>
                  </p>
                  <p className="home-review-stance">
                    <span>Execution</span>
                    <span className={stanceClass(review.execution)}>{stanceLabel[review.execution]}</span>
                  </p>
                </div>
              </a>
            );
          })}
        </div>
        {canNext ? (
          <button className="home-recent-next" type="button" aria-label="Next reviews" onClick={next}>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M9 6l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        ) : null}
      </div>
    </section>
  );
}
