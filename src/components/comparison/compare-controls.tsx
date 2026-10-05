"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { COMPARE_LIMIT, compareHref, compareKey, type CompareRef } from "@/lib/comparison/selection";
import { useCompare } from "./compare-provider";

export function CompareButton({ workType, slug, title }: CompareRef) {
  const { items, add, remove, full } = useCompare();
  const key = compareKey({ workType, slug });
  const included = items.some((item) => compareKey(item) === key);
  const disabled = full && !included;

  return (
    <button
      type="button"
      className="btn btn-ghost"
      aria-pressed={included}
      disabled={disabled}
      onClick={() => (included ? remove(key) : add({ workType, slug, title }))}
    >
      {included ? "Remove from comparison" : disabled ? "Comparison is full" : "Compare"}
    </button>
  );
}

export function CompareTray() {
  const { items, ready, remove, clear } = useCompare();
  const pathname = usePathname();
  const router = useRouter();
  if (!ready || items.length === 0) return null;

  function drop(key: string) {
    const next = items.filter((item) => compareKey(item) !== key);
    remove(key);
    if (pathname === "/compare") router.replace(compareHref(next));
  }

  return (
    <div className="compare-tray" role="region" aria-label="Comparison">
      <div className="shell compare-tray-inner">
        <p className="compare-tray-count">
          {items.length} of {COMPARE_LIMIT}
        </p>
        <ul className="compare-tray-list">
          {items.map((item) => (
            <li key={compareKey(item)}>
              <span>{item.title}</span>
              <button type="button" className="btn btn-ghost" aria-label={`Remove ${item.title}`} onClick={() => drop(compareKey(item))}>
                Remove
              </button>
            </li>
          ))}
        </ul>
        <div className="compare-tray-actions">
          {items.length >= 2 ? (
            <a className="btn btn-primary" href={compareHref(items)}>
              Compare
            </a>
          ) : (
            <p className="meta">Add another work to compare.</p>
          )}
          <button type="button" className="btn btn-ghost" onClick={() => {
            clear();
            if (pathname === "/compare") router.replace("/compare");
          }}>
            Clear
          </button>
        </div>
      </div>
    </div>
  );
}

export function CompareSync({ items }: { items: CompareRef[] }) {
  const { ready, replace } = useCompare();
  const key = items.map(compareKey).join(",");

  useEffect(() => {
    if (!ready) return;
    replace(items);
  }, [ready, key, items, replace]);

  return null;
}

export function CompareRemove({ itemKey, title }: { itemKey: string; title: string }) {
  const { items, remove } = useCompare();
  const pathname = usePathname();
  const router = useRouter();

  return (
    <button
      type="button"
      className="btn btn-ghost"
      aria-label={`Remove ${title}`}
      onClick={() => {
        const next = items.filter((item) => compareKey(item) !== itemKey);
        remove(itemKey);
        if (pathname === "/compare") router.replace(compareHref(next));
      }}
    >
      Remove
    </button>
  );
}
