import { stanceClass, stanceLabel } from "@/lib/domain/labels";
import { MATTERED_LABEL, type MatteredName } from "@/lib/evaluations/mattered";

export function DimensionReading({
  name,
  stance,
  mattered,
}: {
  name: string;
  stance: string;
  mattered?: MatteredName | null;
}) {
  return (
    <>
      <i className={`dimension-dot dimension-dot-${stance.toLowerCase()}`} aria-hidden="true" />
      <span>{name}</span>
      <span className="dimension-reading">
        <span className={stanceClass(stance)}>{stanceLabel[stance] ?? stance}</span>
        {mattered ? <span className="mattered-reading">· {MATTERED_LABEL[mattered]}</span> : null}
      </span>
    </>
  );
}

export function MatteredLegend() {
  return (
    <div className="mattered-legend">
      <p>How much it mattered</p>
      <ul>
        <li>
          <i className="mattered-ring" aria-hidden="true" />
          A little bit
        </li>
        <li>
          <i className="mattered-ring mattered-ring-middle" aria-hidden="true" />
          Quite a bit
        </li>
        <li>
          <i className="mattered-ring mattered-ring-outer" aria-hidden="true" />
          Matters a lot
        </li>
      </ul>
    </div>
  );
}
