"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { COMPARE_LIMIT, compareKey, type CompareRef } from "@/lib/comparison/selection";

type CompareApi = {
  items: CompareRef[];
  ready: boolean;
  full: boolean;
  add: (item: CompareRef) => void;
  remove: (key: string) => void;
  clear: () => void;
  replace: (items: CompareRef[]) => void;
};

const CompareContext = createContext<CompareApi | null>(null);
const STORAGE_KEY = "frame-compare";

function storedItems(raw: string | null): CompareRef[] {
  if (!raw) return [];
  const parsed = JSON.parse(raw) as CompareRef[];
  if (!Array.isArray(parsed)) return [];
  return parsed
    .filter((item) => item && typeof item.slug === "string" && typeof item.title === "string" && typeof item.workType === "string")
    .slice(0, COMPARE_LIMIT);
}

export function CompareProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CompareRef[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      setItems(storedItems(sessionStorage.getItem(STORAGE_KEY)));
    } catch {
      // Storage can be unavailable. The comparison starts empty.
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // The in-memory set still works for this page.
    }
    document.documentElement.dataset.compare = items.length > 0 ? "open" : "closed";
    return () => {
      delete document.documentElement.dataset.compare;
    };
  }, [items, ready]);

  const add = useCallback((item: CompareRef) => {
    setItems((current) => {
      if (current.some((existing) => compareKey(existing) === compareKey(item))) return current;
      if (current.length >= COMPARE_LIMIT) return current;
      return [...current, item];
    });
  }, []);

  const remove = useCallback((key: string) => {
    setItems((current) => current.filter((item) => compareKey(item) !== key));
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const replace = useCallback((next: CompareRef[]) => {
    setItems(next.slice(0, COMPARE_LIMIT));
  }, []);

  const value = useMemo(
    () => ({ items, ready, full: items.length >= COMPARE_LIMIT, add, remove, clear, replace }),
    [items, ready, add, remove, clear, replace],
  );

  return <CompareContext.Provider value={value}>{children}</CompareContext.Provider>;
}

export function useCompare(): CompareApi {
  const value = useContext(CompareContext);
  if (!value) throw new Error("Compare controls must render inside CompareProvider");
  return value;
}
