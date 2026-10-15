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
}: {
  legend: string;
  note: string;
  dimensions: DimensionOption[];
  stanceFor?: (id: string) => string;
}) {
  if (dimensions.length === 0) return null;
  return (
    <fieldset>
      <legend className="legend">{legend}</legend>
      <p className="meta">{note}</p>
      {dimensions.map((dimension) => (
        <div className="dimension-row" key={dimension.id}>
          <span>
            {dimension.name}
            {dimension.description ? <span className="meta">{dimension.description}</span> : null}
          </span>
          <select
            name={`judgment:${dimension.id}`}
            defaultValue={stanceFor?.(dimension.id) ?? ""}
            aria-label={dimension.description ? `${dimension.name}. ${dimension.description}` : dimension.name}
          >
            <option value="">Not judged</option>
            <option value="POSITIVE">Positive</option>
            <option value="MIXED">Mixed</option>
            <option value="NEGATIVE">Negative</option>
          </select>
        </div>
      ))}
    </fieldset>
  );
}
