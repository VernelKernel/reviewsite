"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import type { WorkType } from "@/generated/prisma/client";
import { DimensionChoices, type DimensionOption } from "@/components/evaluations/dimension-fields";
import { createIntake, type IntakeActionState } from "@/lib/intake/actions";

export function IntakeForm({ workType, dimensions }: { workType: WorkType; dimensions: DimensionOption[] }) {
  const [state, action] = useActionState(createIntake, {} as IntakeActionState);
  const noun = workType === "MOVIE" ? "movie" : "game";

  return (
    <form className="form-layout" action={action}>
      <div>
        <p className="kicker">Create your review</p>
        <h1>{workType === "MOVIE" ? "Movies" : "Games"}</h1>
        <p className="lede" style={{ marginTop: "1rem" }}>
          Type the title yourself. Enjoyment and execution stay separate. The chart is drawn from your answers.
        </p>
        <p className="meta">
          <a href={workType === "MOVIE" ? "/review/new?type=game" : "/review/new?type=movie"}>
            Switch to {workType === "MOVIE" ? "games" : "movies"}
          </a>
        </p>
      </div>

      {state.error ? (
        <p className="form-error" role="alert">
          {state.error}
        </p>
      ) : null}

      <input type="hidden" name="workType" value={workType} />

      <label className="field">
        <span>Title</span>
        <input name="title" required minLength={2} maxLength={140} autoComplete="off" placeholder={`The ${noun} you evaluated`} />
      </label>
      <label className="field">
        <span>Platform, optional</span>
        <input name="platform" maxLength={80} autoComplete="off" />
      </label>
      <label className="field">
        <span>Genre, optional</span>
        <input name="genre" maxLength={80} autoComplete="off" />
      </label>

      <fieldset>
        <legend className="legend">Did you enjoy it?</legend>
        <StanceChoices name="enjoyment" />
      </fieldset>
      <DimensionChoices
        legend="Enjoyment, if you want to be more specific"
        note="Leave a row as “Not judged” when you don’t have a view. These are optional, and they stay separate from the headline."
        dimensions={dimensions.filter((dimension) => dimension.family === "ENJOYMENT")}
      />
      <fieldset>
        <legend className="legend">Did you think it was well executed?</legend>
        <StanceChoices name="execution" />
      </fieldset>
      <DimensionChoices
        legend="Execution, if you want to be more specific"
        note="Leave a row as “Not judged” when you don’t have a view. Three or more judged dimensions draw the radar."
        dimensions={dimensions.filter((dimension) => dimension.family !== "ENJOYMENT")}
      />

      <label className="field">
        <span>A note, optional</span>
        <textarea name="reviewBody" maxLength={8000} />
      </label>

      <SubmitButton />
    </form>
  );
}

function StanceChoices({ name }: { name: string }) {
  return (
    <div className="choice-grid">
      {[
        ["POSITIVE", "Yes"],
        ["MIXED", "Mixed"],
        ["NEGATIVE", "No"],
      ].map(([value, label]) => (
        <label className="choice" key={value}>
          <input type="radio" name={name} value={value} required />
          <span>{label}</span>
        </label>
      ))}
    </div>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button className="btn btn-primary" type="submit" disabled={pending} aria-busy={pending}>
      {pending ? "Saving your review…" : "See your chart"}
    </button>
  );
}
