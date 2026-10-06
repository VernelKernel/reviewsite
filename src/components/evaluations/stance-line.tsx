import { stanceClass, stanceLabel } from "@/lib/domain/labels";

export function StanceLine({ items }: { items: { label: string; stance: string }[] }) {
  return (
    <p className="excerpt-stances">
      {items.map((item, index) => (
        <span key={`${item.label}-${index}`}>
          {index > 0 ? " · " : null}
          {item.label}: <span className={stanceClass(item.stance)}>{stanceLabel[item.stance] ?? item.stance}</span>
        </span>
      ))}
    </p>
  );
}
