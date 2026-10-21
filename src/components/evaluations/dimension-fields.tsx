import { useState, type ChangeEvent } from "react";
import { MATTERED_LABEL, MATTERED_VALUES, isMattered } from "@/lib/evaluations/mattered";

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
  mattered,
  onStance,
  onMattered,
  split = false,
}: {
  legend: string;
  note?: string;
  dimensions: DimensionOption[];
  stanceFor?: (id: string) => string;
  values?: Record<string, string>;
  mattered?: Record<string, string>;
  onStance?: (dimensionId: string, stance: string) => void;
  onMattered?: (dimensionId: string, mattered: string) => void;
  split?: boolean;
}) {
  if (dimensions.length === 0) return null;
  return (
    <fieldset>
      <legend className="legend">{legend}</legend>
      {note ? <p className="meta">{note}</p> : null}
      <div className={split ? "builder-dimensions" : undefined}>
        {dimensions.map((dimension) => (
          <DimensionRow
            key={dimension.id}
            dimension={dimension}
            stanceFor={stanceFor}
            values={values}
            mattered={mattered}
            onStance={onStance}
            onMattered={onMattered}
          />
        ))}
      </div>
    </fieldset>
  );
}

function DimensionRow({
  dimension,
  stanceFor,
  values,
  mattered,
  onStance,
  onMattered,
}: {
  dimension: DimensionOption;
  stanceFor?: (id: string) => string;
  values?: Record<string, string>;
  mattered?: Record<string, string>;
  onStance?: (dimensionId: string, stance: string) => void;
  onMattered?: (dimensionId: string, mattered: string) => void;
}) {
  const [uncontrolledStance, setUncontrolledStance] = useState(stanceFor?.(dimension.id) ?? "");
  const stance = onStance ? (values?.[dimension.id] ?? "") : uncontrolledStance;
  const judged = stance === "POSITIVE" || stance === "MIXED" || stance === "NEGATIVE";
  const label = dimension.family === "WORK" && dimension.description ? `${dimension.name}. ${dimension.description}` : dimension.name;

  function changeStance(next: string) {
    if (onStance) onStance(dimension.id, next);
    else setUncontrolledStance(next);
  }

  return (
    <div className="dimension-row">
      <span>
        {dimension.name}
        {dimension.family === "WORK" && dimension.description ? <small>{dimension.description}</small> : null}
      </span>
      <div className="dimension-controls">
        <DimensionStance id={dimension.id} label={label} stance={stance} onChange={changeStance} />
        {judged ? (
          <MatteredSelect id={dimension.id} name={dimension.name} value={mattered?.[dimension.id] ?? ""} onChange={onMattered} />
        ) : null}
      </div>
    </div>
  );
}

function DimensionStance({
  id,
  label,
  stance,
  onChange,
}: {
  id: string;
  label: string;
  stance: string;
  onChange: (stance: string) => void;
}) {
  const tone = stance === "POSITIVE" || stance === "MIXED" || stance === "NEGATIVE" ? stance.toLowerCase() : "open";

  function change(event: ChangeEvent<HTMLSelectElement>) {
    onChange(event.target.value);
  }

  return (
    <div className={`stance-select stance-select-${tone}`}>
      {tone === "open" ? null : <i className={`dimension-dot dimension-dot-${tone}`} aria-hidden="true" />}
      <select name={`judgment:${id}`} aria-label={label} value={stance} onChange={change}>
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

function MatteredSelect({
  id,
  name,
  value,
  onChange,
}: {
  id: string;
  name: string;
  value: string;
  onChange?: (dimensionId: string, mattered: string) => void;
}) {
  const [uncontrolled, setUncontrolled] = useState(value);
  const current = onChange ? value : uncontrolled;
  const set = isMattered(current);

  function change(event: ChangeEvent<HTMLSelectElement>) {
    const next = event.target.value;
    if (onChange) onChange(id, next);
    else setUncontrolled(next);
  }

  return (
    <div className={`stance-select mattered-select${set ? " mattered-select-set" : ""}`}>
      <select name={`mattered:${id}`} aria-label={`How much ${name} mattered`} value={current} onChange={change}>
        <option value="" disabled>
          Mattered
        </option>
        {MATTERED_VALUES.map((option) => (
          <option key={option} value={option}>
            {MATTERED_LABEL[option]}
          </option>
        ))}
      </select>
      <svg className="stance-select-chevron" viewBox="0 0 12 12" aria-hidden="true">
        <path d="M2.2 4.4 6 8.1 9.8 4.4" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}
