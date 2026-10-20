import { stanceLabel } from "@/lib/domain/labels";

const stances = ["POSITIVE", "MIXED", "NEGATIVE"] as const;

export function StancePills({ name, value, onChange }: { name: string; value: string; onChange: (value: string) => void }) {
  return (
    <div className="stance-pills">
      {stances.map((stance) => (
        <label className={`stance-pill stance-pill-${stance.toLowerCase()}`} key={stance}>
          <input type="radio" name={name} value={stance} required checked={value === stance} onChange={() => onChange(stance)} />
          <StanceFace stance={stance.toLowerCase() as "positive" | "mixed" | "negative"} />
          <span>{stanceLabel[stance]}</span>
        </label>
      ))}
    </div>
  );
}

function StanceFace({ stance }: { stance: "positive" | "mixed" | "negative" }) {
  return (
    <svg className="stance-face" viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="1.7" />
      {stance === "negative" ? (
        <path
          d="M6.2 6.6 10.5 11 M10.5 6.6 6.2 11 M13.5 6.6 17.8 11 M17.8 6.6 13.5 11 M7.6 16.2h8.8"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      ) : (
        <>
          <circle cx="9" cy="10" r="1.15" fill="currentColor" />
          <circle cx="15" cy="10" r="1.15" fill="currentColor" />
          {stance === "positive" ? (
            <path d="M8.2 13.4c1 1.8 2.3 2.6 3.8 2.6s2.8-.8 3.8-2.6" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
          ) : (
            <path d="M8.2 15.2h7.6" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
          )}
        </>
      )}
    </svg>
  );
}
