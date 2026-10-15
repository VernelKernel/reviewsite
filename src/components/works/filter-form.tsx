"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

export type FilterGroup = {
  name: string;
  label: string;
  anyLabel: string;
  value?: string;
  options: { value: string; label: string }[];
};

export function FilterForm({ base, groups }: { base: string; groups: FilterGroup[] }) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [scripted, setScripted] = useState(false);
  const [pending, startTransition] = useTransition();

  useEffect(() => setScripted(true), []);

  function apply() {
    const form = formRef.current;
    if (!form) return;
    const params = new URLSearchParams();
    for (const [name, value] of new FormData(form)) {
      if (typeof value === "string" && value) params.set(name, value);
    }
    const query = params.toString();
    startTransition(() => router.push(query ? `${base}?${query}` : base, { scroll: false }));
  }

  return (
    <form
      ref={formRef}
      className="filter-form"
      action={base}
      method="get"
      aria-label="Filter evaluations"
      aria-busy={pending}
      onSubmit={(event) => {
        event.preventDefault();
        apply();
      }}
    >
      {groups.map((group) => (
        <div key={group.name} className="filter-select">
          <label className="sr-only" htmlFor={`filter-${group.name}`}>
            {group.label}
          </label>
          <select id={`filter-${group.name}`} name={group.name} defaultValue={group.value ?? ""} onChange={apply}>
            <option value="">{group.anyLabel}</option>
            {group.options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      ))}
      {scripted ? null : (
        <button className="btn btn-secondary" type="submit">
          Apply
        </button>
      )}
    </form>
  );
}
