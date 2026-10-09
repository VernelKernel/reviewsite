"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { addMissingPublications, enableOutletPass, type EnableState } from "@/lib/admin/outlet-actions";
import type { ExpandResult } from "@/lib/catalog/expand-outlets";

export type ThinGameRow = {
  id: string;
  title: string;
  slug: string;
  criticCount: number;
  thin: boolean;
  enabled: boolean;
};

export function ThinGameList({ games }: { games: ThinGameRow[] }) {
  const [checked, setChecked] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(games.map((game) => [game.id, game.enabled])),
  );
  const [enableState, enableAction] = useActionState(enableOutletPass, null);
  const [addState, addAction] = useActionState(addMissingPublications, null);
  const enabledCount = games.filter((game) => game.enabled).length;

  return (
    <>
      <form action={enableAction} className="form-layout">
        <div className="hero-actions">
          <button
            className="btn btn-secondary"
            type="button"
            onClick={() =>
              setChecked((current) => Object.fromEntries(games.map((game) => [game.id, game.thin || Boolean(current[game.id])])))
            }
          >
            Detect thin games
          </button>
          <button
            className="btn btn-secondary"
            type="button"
            onClick={() => setChecked(Object.fromEntries(games.map((game) => [game.id, true])))}
          >
            Select all
          </button>
          <SubmitButton label="Enable selected" />
        </div>
        <Status message={enableMessage(enableState)} error={enableState?.error} />
        <div className="choice-grid">
          {games.map((game) => (
            <div key={game.id}>
              <input type="hidden" name="listed" value={game.id} />
              <label className="choice">
                <input
                  type="checkbox"
                  name="workId"
                  value={game.id}
                  checked={checked[game.id] ?? false}
                  onChange={(event) => setChecked((current) => ({ ...current, [game.id]: event.target.checked }))}
                />
                <span>
                  <a href={`/games/${game.slug}`}>{game.title}</a>
                  <small>
                    {game.criticCount} critic {game.criticCount === 1 ? "reading" : "readings"}
                    {game.thin ? " · Thin" : ""}
                    {game.enabled ? " · Enabled" : ""}
                  </small>
                </span>
              </label>
            </div>
          ))}
        </div>
      </form>
      <form action={addAction} className="hero-actions">
        <SubmitButton label={enabledCount === 0 ? "Add missing publications" : `Add missing publications for ${enabledCount}`} />
      </form>
      <Status message={addMessage(addState)} error={addState?.error} />
    </>
  );
}

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button className="btn btn-primary" type="submit" disabled={pending} aria-busy={pending}>
      {pending ? "Working" : label}
    </button>
  );
}

function Status({ message, error }: { message: string | null; error?: string }) {
  if (error) return <p className="lede">{error}</p>;
  if (!message) return null;
  return <p className="lede">{message}</p>;
}

function enableMessage(state: EnableState): string | null {
  if (!state || state.error || state.enabled === undefined) return null;
  if (state.enabled === 1) return "1 game enabled for the publication pass.";
  return `${state.enabled} games enabled for the publication pass.`;
}

function addMessage(state: ExpandResult | null): string | null {
  if (!state || state.error) return null;
  const archives = state.added.filter((item) => item.archive).length;
  const names = state.added.map((item) => item.name).join(", ");
  const added =
    state.added.length === 0
      ? "No new publications were on those critic lists."
      : `Added ${state.added.length} ${state.added.length === 1 ? "publication" : "publications"}${names ? `: ${names}` : ""}. ${archives} ${archives === 1 ? "has" : "have"} a readable archive.`;
  const unmatched = state.unmatched.length > 0 ? ` No critic-list match for ${state.unmatched.join(", ")}.` : "";
  const deferred = state.deferred > 0 ? ` ${state.deferred} archives will be checked on the next run.` : "";
  return `${added}${unmatched}${deferred}`;
}
