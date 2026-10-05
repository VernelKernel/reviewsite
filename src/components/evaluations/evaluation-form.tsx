"use client";

import { useActionState, useState, type Dispatch, type SetStateAction } from "react";
import { useFormStatus } from "react-dom";
import type { WorkType } from "@/generated/prisma/client";
import { saveEvaluation, type ActionState } from "@/lib/evaluation/actions";
import {
  completionLabel,
  ownershipLabel,
  playtimeLabel,
} from "@/lib/domain/labels";

type Option = { id: string; name: string };
type Judgment = { dimensionId: string; stance: string };
type Observation = { topicId: string; polarity: string; content: string };

const completions = ["JUST_STARTED", "EARLY", "SUBSTANTIAL", "COMPLETED", "ENDGAME", "POST_GAME", "ABANDONED", "UNKNOWN"];
const playtimes = ["LESS_THAN_ONE_HOUR", "ONE_TO_FIVE_HOURS", "FIVE_TO_TEN_HOURS", "TEN_TO_TWENTY_HOURS", "TWENTY_TO_FIFTY_HOURS", "FIFTY_PLUS_HOURS", "UNKNOWN"];
const ownerships = ["OWNED", "SUBSCRIPTION", "BORROWED", "GIFTED", "REVIEW_COPY", "FREE", "OTHER"];

function SubmitButton({ editing }: { editing: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button className="btn btn-primary" type="submit" disabled={pending} aria-busy={pending}>
      {pending ? "Saving evaluation…" : editing ? "Update evaluation" : "Publish evaluation"}
    </button>
  );
}

export function EvaluationForm({
  workType,
  slug,
  title,
  dimensions,
  topics,
  platforms,
  defaults,
}: {
  workType: WorkType;
  slug: string;
  title: string;
  dimensions: Option[];
  topics: Option[];
  platforms: Option[];
  defaults: {
    email: string;
    displayName: string;
    lens: string;
    standard: string;
    standardNote: string;
    enjoyment: string;
    execution: string;
    completion: string;
    playtime: string;
    ownership: string;
    platformId: string;
    reviewTitle: string;
    reviewBody: string;
    imported: boolean;
    importSourceName: string;
    importSourceUrl: string;
    judgments: Judgment[];
    observations: Observation[];
  } | null;
}) {
  const action = saveEvaluation.bind(null, workType, slug);
  const [state, formAction] = useActionState(action, {} as ActionState);
  const [observations, setObservations] = useState<Observation[]>(
    defaults?.observations.length
      ? defaults.observations
      : [{ topicId: topics[0]?.id ?? "", polarity: "CRITICISM", content: "" }],
  );

  const stanceFor = (dimensionId: string) => defaults?.judgments.find((item) => item.dimensionId === dimensionId)?.stance ?? "";

  return (
    <form className="form-layout" action={formAction}>
      <div>
        <p className="kicker">Evaluate</p>
        <h1>{title}</h1>
        <p className="lede" style={{ marginTop: "1rem" }}>
          A short structure first, then the reason. Enjoyment and execution are separate questions.
        </p>
      </div>

      {state.error ? (
        <p className="form-error" role="alert">
          {state.error}
        </p>
      ) : null}

      <fieldset>
        <legend className="legend">Who is evaluating</legend>
        <p className="meta">
          This preview remembers an email on this server so you can edit the same evaluation later. It is not a verified login.
        </p>
        <label className="field">
          <span>Display name</span>
          <input name="displayName" required minLength={2} maxLength={48} defaultValue={defaults?.displayName ?? ""} />
        </label>
        <label className="field">
          <span>Email</span>
          <input name="email" type="email" required autoComplete="email" defaultValue={defaults?.email ?? ""} />
        </label>
      </fieldset>

      <fieldset>
        <legend className="legend">What were you primarily evaluating?</legend>
        <div className="choice-grid">
          <Choice name="lens" value="EXECUTION" defaultChecked={defaults?.lens === "EXECUTION"} title="Execution" detail="Gameplay, craft, technical quality, whether it does what it attempts." />
          <Choice name="lens" value="EXPERIENCE" defaultChecked={defaults?.lens === "EXPERIENCE"} title="Experience" detail="Story, artistic experience, or how it felt to spend time with it." />
          <Choice name="lens" value="MIXED" defaultChecked={defaults?.lens === "MIXED"} title="A combination" detail="Execution and experience both shaped the judgment." />
        </div>
      </fieldset>

      <fieldset>
        <legend className="legend">Did the work’s circumstances affect your standards?</legend>
        <div className="choice-grid">
          <Choice name="standard" value="ABSOLUTE" defaultChecked={defaults?.standard === "ABSOLUTE"} title="No" detail="Essentially the same standards I use for other works." />
          <Choice name="standard" value="MIXED" defaultChecked={defaults?.standard === "MIXED"} title="Somewhat" detail="Context mattered, but it did not replace my usual standard." />
          <Choice name="standard" value="CONTEXTUAL" defaultChecked={defaults?.standard === "CONTEXTUAL"} title="Yes" detail="I consciously adjusted expectations." />
        </div>
        <label className="field">
          <span>If you adjusted, what circumstances mattered? Optional.</span>
          <input name="standardNote" maxLength={280} defaultValue={defaults?.standardNote ?? ""} />
        </label>
      </fieldset>

      <fieldset>
        <legend className="legend">Did you enjoy it?</legend>
        <StanceChoices name="enjoyment" selected={defaults?.enjoyment ?? ""} />
      </fieldset>

      <fieldset>
        <legend className="legend">Did you think it was well executed?</legend>
        <StanceChoices name="execution" selected={defaults?.execution ?? ""} />
      </fieldset>

      <fieldset>
        <legend className="legend">How much did you experience?</legend>
        <label className="field">
          <span>Completion</span>
          <select name="completion" defaultValue={defaults?.completion ?? "SUBSTANTIAL"}>
            {completions.map((value) => (
              <option key={value} value={value}>
                {completionLabel[value]}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Approximate time</span>
          <select name="playtime" defaultValue={defaults?.playtime ?? "UNKNOWN"}>
            {playtimes.map((value) => (
              <option key={value} value={value}>
                {playtimeLabel[value]}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Platform</span>
          <select name="platformId" defaultValue={defaults?.platformId ?? ""}>
            <option value="">Not specified</option>
            {platforms.map((platform) => (
              <option key={platform.id} value={platform.id}>
                {platform.name}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>How you had access</span>
          <select name="ownership" defaultValue={defaults?.ownership ?? ""}>
            <option value="">Not specified</option>
            {ownerships.map((value) => (
              <option key={value} value={value}>
                {ownershipLabel[value]}
              </option>
            ))}
          </select>
        </label>
      </fieldset>

      {dimensions.length > 0 ? (
        <fieldset>
          <legend className="legend">Dimensions, if you want to be more specific</legend>
          <p className="meta">Leave a row as “Not judged” when you don’t have a view. These are optional.</p>
          {dimensions.map((dimension) => (
            <div className="dimension-row" key={dimension.id}>
              <span>{dimension.name}</span>
              <select name={`judgment:${dimension.id}`} defaultValue={stanceFor(dimension.id)} aria-label={dimension.name}>
                <option value="">Not judged</option>
                <option value="POSITIVE">Positive</option>
                <option value="MIXED">Mixed</option>
                <option value="NEGATIVE">Negative</option>
              </select>
            </div>
          ))}
        </fieldset>
      ) : null}

      <fieldset>
        <legend className="legend">Tell us why. What worked? What didn’t?</legend>
        <label className="choice">
          <input type="checkbox" name="imported" defaultChecked={defaults?.imported ?? false} />
          <span>
            This text was written somewhere else
            <small>Imported reviews stay marked as imported.</small>
          </span>
        </label>
        <label className="field">
          <span>Title, optional</span>
          <input name="reviewTitle" maxLength={140} defaultValue={defaults?.reviewTitle ?? ""} />
        </label>
        <label className="field">
          <span>Review</span>
          <textarea name="reviewBody" defaultValue={defaults?.reviewBody ?? ""} />
        </label>
        <label className="field">
          <span>Original publication, if imported</span>
          <input name="importSourceName" maxLength={120} defaultValue={defaults?.importSourceName ?? ""} />
        </label>
        <label className="field">
          <span>Source URL, if imported</span>
          <input name="importSourceUrl" type="url" placeholder="https://" defaultValue={defaults?.importSourceUrl ?? ""} />
        </label>
      </fieldset>

      <fieldset>
        <legend className="legend">A specific observation, optional</legend>
        {observations.map((observation, index) => (
          <div className="panel" key={index}>
            {observations.length > 1 ? (
              <div className="observation-draft-actions">
                <button
                  className="btn btn-secondary"
                  type="button"
                  onClick={() => removeObservation(setObservations, index)}
                  aria-label={`Remove observation ${index + 1}`}
                >
                  Remove
                </button>
              </div>
            ) : null}
            <label className="field">
              <span>Topic</span>
              <select
                name="observationTopic"
                value={observation.topicId}
                onChange={(event) => updateObservation(setObservations, index, { topicId: event.target.value })}
              >
                {topics.map((topic) => (
                  <option key={topic.id} value={topic.id}>
                    {topic.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>Praise or criticism</span>
              <select
                name="observationPolarity"
                value={observation.polarity}
                onChange={(event) => updateObservation(setObservations, index, { polarity: event.target.value })}
              >
                <option value="PRAISE">Praise</option>
                <option value="CRITICISM">Criticism</option>
              </select>
            </label>
            <label className="field">
              <span>What did you actually see?</span>
              <textarea
                name="observationContent"
                value={observation.content}
                onChange={(event) => updateObservation(setObservations, index, { content: event.target.value })}
              />
            </label>
          </div>
        ))}
        {observations.length < 8 ? (
          <button
            className="btn btn-secondary"
            type="button"
            onClick={() =>
              setObservations((rows) => [...rows, { topicId: topics[0]?.id ?? "", polarity: "CRITICISM", content: "" }])
            }
          >
            Add another observation
          </button>
        ) : null}
      </fieldset>

      <SubmitButton editing={Boolean(defaults)} />
    </form>
  );
}

function Choice({
  name,
  value,
  title,
  detail,
  defaultChecked,
}: {
  name: string;
  value: string;
  title: string;
  detail: string;
  defaultChecked: boolean;
}) {
  return (
    <label className="choice">
      <input type="radio" name={name} value={value} required defaultChecked={defaultChecked} />
      <span>
        {title}
        <small>{detail}</small>
      </span>
    </label>
  );
}

function StanceChoices({ name, selected }: { name: string; selected: string }) {
  return (
    <div className="choice-grid">
      {[
        ["POSITIVE", "Yes"],
        ["MIXED", "Mixed"],
        ["NEGATIVE", "No"],
      ].map(([value, label]) => (
        <label className="choice" key={value}>
          <input type="radio" name={name} value={value} required defaultChecked={selected === value} />
          <span>{label}</span>
        </label>
      ))}
    </div>
  );
}

function updateObservation(
  setObservations: Dispatch<SetStateAction<Observation[]>>,
  index: number,
  patch: Partial<Observation>,
) {
  setObservations((rows) => rows.map((row, rowIndex) => (rowIndex === index ? { ...row, ...patch } : row)));
}

function removeObservation(setObservations: Dispatch<SetStateAction<Observation[]>>, index: number) {
  setObservations((rows) => rows.filter((_, rowIndex) => rowIndex !== index));
}
