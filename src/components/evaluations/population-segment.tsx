"use client";

import type { ShapeMode } from "@/lib/aggregation/landscape";

const MODES: { value: ShapeMode; label: string }[] = [
  { value: "both", label: "Both" },
  { value: "audience", label: "Audience" },
  { value: "critics", label: "Critics" },
];

export function PopulationSegment({
  mode,
  onMode,
  criticsAvailable = true,
  audienceAvailable = true,
}: {
  mode: ShapeMode;
  onMode: (mode: ShapeMode) => void;
  criticsAvailable?: boolean;
  audienceAvailable?: boolean;
}) {
  return (
    <div className="shape-segment" role="radiogroup" aria-label="Population">
      {MODES.map((item) => {
        const missing = (item.value === "critics" && !criticsAvailable) || (item.value === "audience" && !audienceAvailable);
        return (
          <button
            key={item.value}
            type="button"
            role="radio"
            aria-checked={mode === item.value}
            disabled={missing}
            title={missing ? `No ${item.label.toLowerCase()} evaluations in this view` : undefined}
            onClick={() => onMode(item.value)}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
