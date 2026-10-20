"use client";

import { useEffect, useRef, useState } from "react";
import { stanceClass, stanceLabel } from "@/lib/domain/labels";
import { flattenSections, syncSectionBlocks, type SectionBlock, type StoredSection } from "@/lib/reviews/sections";

type JudgedDimension = { id: string; name: string; stance: string };

export function ReviewComposer({
  label,
  judged,
  catalog,
  initialBody,
  initialSections,
  forcedContinuous = false,
  hideLabel = false,
  maxLength = 20000,
}: {
  label: string;
  judged: JudgedDimension[];
  catalog: { id: string; name: string }[];
  initialBody: string;
  initialSections: StoredSection[];
  forcedContinuous?: boolean;
  hideLabel?: boolean;
  maxLength?: number;
}) {
  const seeded = splitSections(initialSections);
  const [mode, setMode] = useState<"continuous" | "sections">(seeded ? "sections" : "continuous");
  const [continuous, setContinuous] = useState(initialBody);
  const [opening, setOpening] = useState(seeded?.opening ?? "");
  const [blocks, setBlocks] = useState<SectionBlock[]>(seeded?.blocks ?? []);
  const [continuousDirty, setContinuousDirty] = useState(false);
  const snapshot = useRef<{ opening: string; blocks: SectionBlock[] } | null>(
    seeded ? { opening: seeded.opening, blocks: seeded.blocks } : null,
  );
  const forcing = useRef(false);
  const openingRef = useRef(opening);
  const blocksRef = useRef(blocks);
  openingRef.current = opening;
  blocksRef.current = blocks;

  useEffect(() => {
    if (mode !== "sections" || forcedContinuous) return;
    setBlocks((current) => syncSectionBlocks(current, judged.map((item) => item.id)));
  }, [mode, forcedContinuous, judged]);

  useEffect(() => {
    if (forcedContinuous) {
      if (forcing.current) return;
      forcing.current = true;
      if (mode === "sections") {
        snapshot.current = { opening: openingRef.current, blocks: blocksRef.current };
        setContinuous(flattenSections([{ body: openingRef.current }, ...blocksRef.current]));
        setContinuousDirty(false);
      }
      return;
    }
    if (!forcing.current) return;
    forcing.current = false;
    if (continuousDirty) setMode("continuous");
  }, [forcedContinuous, continuousDirty, mode]);

  const showSections = mode === "sections" && !forcedContinuous;
  const names = new Map(catalog.map((dimension) => [dimension.id, dimension.name]));
  for (const item of judged) names.set(item.id, item.name);
  const stanceFor = new Map(judged.map((item) => [item.id, item.stance]));

  function choose(next: "continuous" | "sections") {
    if (next === mode) return;
    if (next === "continuous") {
      snapshot.current = { opening, blocks };
      setContinuous(flattenSections([{ body: opening }, ...blocks]));
      setContinuousDirty(false);
      setMode("continuous");
      return;
    }
    if (snapshot.current && !continuousDirty) {
      setOpening(snapshot.current.opening);
      setBlocks(snapshot.current.blocks);
    } else {
      setOpening(continuous);
      setBlocks(judged.map((item) => ({ dimensionId: item.id, body: "" })));
    }
    setMode("sections");
  }

  function move(index: number, direction: -1 | 1) {
    setBlocks((current) => {
      const target = index + direction;
      if (target < 0 || target >= current.length) return current;
      const next = current.slice();
      const [item] = next.splice(index, 1);
      next.splice(target, 0, item);
      return next;
    });
  }

  return (
    <div className="review-composer">
      <div className="review-composer-head">
        {hideLabel ? null : <span>{label}</span>}
        {forcedContinuous ? null : (
          <div className="shape-segment" role="radiogroup" aria-label="How this review is written">
            <button type="button" aria-checked={mode === "continuous"} onClick={() => choose("continuous")}>
              Continuous
            </button>
            <button type="button" aria-checked={mode === "sections"} onClick={() => choose("sections")}>
              By dimension
            </button>
          </div>
        )}
      </div>
      {showSections ? (
        <div className="review-stack">
          <input type="hidden" name="reviewMode" value="sections" />
          <label className="field review-block">
            <textarea
              name="reviewOpening"
              maxLength={maxLength}
              value={opening}
              aria-label="Beginning, optional"
              placeholder="Beginning, optional"
              onChange={(event) => setOpening(event.target.value)}
            />
          </label>
          {blocks.length === 0 ? (
            <p className="meta">Judgments you make under Enjoyment or Execution show up here, in the order you set them.</p>
          ) : (
            blocks.map((block, index) => {
              const name = names.get(block.dimensionId) ?? "Dimension";
              const stance = stanceFor.get(block.dimensionId);
              return (
                <div className="review-block" key={block.dimensionId}>
                  <div className="review-block-head">
                    <strong>
                      {name}
                      {stance ? <span className={stanceClass(stance)}> · {stanceLabel[stance] ?? stance}</span> : null}
                    </strong>
                    <div className="review-block-actions">
                      <button
                        className="btn btn-secondary"
                        type="button"
                        disabled={index === 0}
                        aria-label={`Move ${name} up`}
                        onClick={() => move(index, -1)}
                      >
                        <svg viewBox="0 0 12 12" aria-hidden="true">
                          <path d="M6 2.5 10 8H2Z" />
                        </svg>
                      </button>
                      <button
                        className="btn btn-secondary"
                        type="button"
                        disabled={index === blocks.length - 1}
                        aria-label={`Move ${name} down`}
                        onClick={() => move(index, 1)}
                      >
                        <svg viewBox="0 0 12 12" aria-hidden="true">
                          <path d="M6 9.5 2 4h8Z" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  <input type="hidden" name="sectionDimension" value={block.dimensionId} />
                  <label className="field">
                    <span className="sr-only">{name}</span>
                    <textarea
                      name="sectionBody"
                      maxLength={maxLength}
                      value={block.body}
                      aria-label={`${name} review`}
                      onChange={(event) =>
                        setBlocks((current) =>
                          current.map((item) => (item.dimensionId === block.dimensionId ? { ...item, body: event.target.value } : item)),
                        )
                      }
                    />
                  </label>
                </div>
              );
            })
          )}
        </div>
      ) : (
        <label className="field">
          <span className="sr-only">{label}</span>
          <textarea
            name="reviewBody"
            maxLength={maxLength}
            value={continuous}
            onChange={(event) => {
              setContinuous(event.target.value);
              setContinuousDirty(true);
            }}
          />
        </label>
      )}
    </div>
  );
}

function splitSections(sections: StoredSection[]): { opening: string; blocks: SectionBlock[] } | null {
  if (sections.length === 0) return null;
  const opening = sections
    .filter((section) => !section.dimensionId)
    .map((section) => section.body.trim())
    .filter(Boolean)
    .join("\n\n");
  const blocks = sections.flatMap((section) =>
    section.dimensionId ? [{ dimensionId: section.dimensionId, body: section.body }] : [],
  );
  return { opening, blocks };
}
