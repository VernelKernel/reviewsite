import { MatteredLegend } from "@/components/evaluations/dimension-reading";
import { MATTERED_RADIUS, usesMattered, type MatteredName } from "@/lib/evaluations/mattered";
import { axisDistance } from "@/lib/evaluations/radar";
import { STANCE_RADIUS } from "@/lib/intake/judgments";

export type PersonalAxis = {
  name: string;
  stance: "POSITIVE" | "MIXED" | "NEGATIVE";
  mattered?: MatteredName | null;
};

const STANCE_RINGS = [STANCE_RADIUS.NEGATIVE, STANCE_RADIUS.MIXED, STANCE_RADIUS.POSITIVE];
const MATTERED_RINGS = [MATTERED_RADIUS.A_LITTLE, MATTERED_RADIUS.QUITE_A_BIT, MATTERED_RADIUS.MATTERS_A_LOT];

export function PersonalShape({ axes, labelledBy }: { axes: PersonalAxis[]; labelledBy: string }) {
  if (axes.length < 3) {
    return <p className="meta">The radar is drawn when at least three dimensions are judged. Enjoyment and execution are shown beside it.</p>;
  }

  const width = 720;
  const height = 640;
  const cx = 360;
  const cy = 312;
  const radius = 176;
  const mattered = usesMattered(axes);
  const rings = mattered ? MATTERED_RINGS : STANCE_RINGS;
  const points = axes.map((axis, index) => polar(cx, cy, radius, index, axes.length, axisDistance(axis)));

  return (
    <div className="personal-shape">
      <svg className="radar-chart" viewBox={`0 0 ${width} ${height}`} role="img" aria-labelledby={labelledBy}>
      {rings.map((ring) => (
        <circle key={ring} className="radar-ring" cx={cx} cy={cy} r={radius * ring} />
      ))}
      {axes.map((axis, index) => {
        const end = polar(cx, cy, radius, index, axes.length, 1);
        return <line key={axis.name} className="radar-spoke" x1={cx} y1={cy} x2={end.x} y2={end.y} />;
      })}
      <polygon className="radar-audience" points={points.map((point) => `${point.x},${point.y}`).join(" ")} />
      {axes.map((axis, index) => {
        const point = points[index];
        return <circle key={`${axis.name}-dot`} className={`radar-dot radar-dot-${axis.stance.toLowerCase()}`} cx={point.x} cy={point.y} r={5} />;
      })}
      {axes.map((axis, index) => {
        const point = polar(cx, cy, radius + 56, index, axes.length, 1);
        const cos = Math.cos(point.angle);
        const anchor = cos > 0.35 ? "start" : cos < -0.35 ? "end" : "middle";
        return (
          <text key={`${axis.name}-label`} className="radar-label" x={point.x} y={point.y} textAnchor={anchor} dominantBaseline="middle">
            {axis.name}
          </text>
        );
      })}
      </svg>
      {mattered ? <MatteredLegend /> : null}
    </div>
  );
}

function polar(cx: number, cy: number, radius: number, index: number, total: number, distance: number) {
  const angle = -Math.PI / 2 + (index * 2 * Math.PI) / total;
  return { x: cx + Math.cos(angle) * radius * distance, y: cy + Math.sin(angle) * radius * distance, angle };
}
