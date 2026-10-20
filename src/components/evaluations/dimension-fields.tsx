import { useState, type ChangeEvent } from "react";

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
  note?: string;
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
      {note ? <p className="meta">{note}</p> : null}
      <div className={split ? "builder-dimensions" : undefined}>
        {dimensions.map((dimension) => (
          <div className="dimension-row" key={dimension.id}>
            <span>
              {dimension.name}
              {dimension.description ? <span className="meta">{dimension.description}</span> : null}
            </span>
            <DimensionStance
              id={dimension.id}
              label={dimension.description ? `${dimension.name}. ${dimension.description}` : dimension.name}
              stanceFor={stanceFor}
              values={values}
              onStance={onStance}
            />
          </div>
        ))}
      </div>
    </fieldset>
  );
}

function DimensionStance({
  id,
  label,
  stanceFor,
  values,
  onStance,
}: {
  id: string;
  label: string;
  stanceFor?: (id: string) => string;
  values?: Record<string, string>;
  onStance?: (dimensionId: string, stance: string) => void;
}) {
  const [uncontrolled, setUncontrolled] = useState(stanceFor?.(id) ?? "");
  const current = onStance ? (values?.[id] ?? "") : uncontrolled;
  const tone = current === "POSITIVE" || current === "MIXED" || current === "NEGATIVE" ? current.toLowerCase() : "open";

  function change(event: ChangeEvent<HTMLSelectElement>) {
    const next = event.target.value;
    if (onStance) onStance(id, next);
    else setUncontrolled(next);
  }

  return (
    <div className={`stance-select stance-select-${tone}`}>
      {tone === "open" ? null : <i className={`dimension-dot dimension-dot-${tone}`} aria-hidden="true" />}
      <select name={`judgment:${id}`} aria-label={label} value={current} onChange={change}>
        <option value="">Skip</option>
        <option value="POSITIVE">Positive</option>
        <option value="MIXED">Mixed</option>
        <option value="NEGATIVE">Negative</option>
      </select>
      <svg className="stance-select-chevron" viewBox="0 0 12 12" aria-hidden="true">
        <path d="M2.2 4.4 6 8.1 9.8 4.4" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}
