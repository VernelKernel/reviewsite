import type { ChangeEvent } from "react";

export type DimensionOption = {
  id: string;
  name: string;
  family: "WORK" | "ENJOYMENT";
  description: string | null;
};

export function DimensionChoices({
  legend,
  note,
  dimensions,
  stanceFor,
  values,
  onStance,
  split = false,
}: {
  legend: string;
  note: string;
  dimensions: DimensionOption[];
  stanceFor?: (id: string) => string;
  values?: Record<string, string>;
  onStance?: (dimensionId: string, stance: string) => void;
  split?: boolean;
}) {
  if (dimensions.length === 0) return null;
  return (
    <fieldset>
      <legend className="legend">{legend}</legend>
      <p className="meta">{note}</p>
      <div className={split ? "builder-dimensions" : undefined}>
        {dimensions.map((dimension) => (
          <div className="dimension-row" key={dimension.id}>
            <span>
              {dimension.name}
              {dimension.description ? <span className="meta">{dimension.description}</span> : null}
            </span>
            <select
              name={`judgment:${dimension.id}`}
              aria-label={dimension.description ? `${dimension.name}. ${dimension.description}` : dimension.name}
              {...(onStance
                ? {
                    value: values?.[dimension.id] ?? "",
                    onChange: (event: ChangeEvent<HTMLSelectElement>) => onStance(dimension.id, event.target.value),
                  }
                : { defaultValue: stanceFor?.(dimension.id) ?? "" })}
            >
              <option value="">Not judged</option>
              <option value="POSITIVE">Positive</option>
              <option value="MIXED">Mixed</option>
              <option value="NEGATIVE">Negative</option>
            </select>
          </div>
        ))}
      </div>
    </fieldset>
  );
}
