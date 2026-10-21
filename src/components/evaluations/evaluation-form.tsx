"use client";

import { useActionState, useEffect, useMemo, useState, type Dispatch, type SetStateAction } from "react";
import type { WorkType } from "@/generated/prisma/client";
import { DimensionChoices, type DimensionOption } from "@/components/evaluations/dimension-fields";
import { StancePills } from "@/components/evaluations/stance-pills";
import { EvaluationPreview, IntentButton, isStance } from "@/components/evaluations/evaluation-preview";
import { ReviewComposer } from "@/components/evaluations/review-composer";
import { ArtImage } from "@/components/works/work-art";
import { saveEvaluation, type ActionState } from "@/lib/evaluation/actions";
import { completionLabel, ownershipLabel, playtimeLabel, stanceLabel } from "@/lib/domain/labels";
import { isMattered } from "@/lib/evaluations/mattered";
import type { RadarAxis } from "@/lib/evaluations/radar";
import { judgedDimensions, rememberJudgment, type StoredSection } from "@/lib/reviews/sections";
import type { WorkArt } from "@/lib/works/present";

type Option = { id: string; name: string };
type Judgment = { dimensionId: string; stance: string; mattered?: string | null };
type Observation = { topicId: string; polarity: string; content: string };
type Genre = { name: string; slug: string };

const completions = ["JUST_STARTED", "EARLY", "SUBSTANTIAL", "COMPLETED", "ENDGAME", "POST_GAME", "ABANDONED", "UNKNOWN"];
const playtimes = ["LESS_THAN_ONE_HOUR", "ONE_TO_FIVE_HOURS", "FIVE_TO_TEN_HOURS", "TEN_TO_TWENTY_HOURS", "TWENTY_TO_FIFTY_HOURS", "FIFTY_PLUS_HOURS", "UNKNOWN"];
const ownerships = ["OWNED", "SUBSCRIPTION", "BORROWED", "GIFTED", "REVIEW_COPY", "FREE", "OTHER"];
const steps = [
  { id: "basics", anchor: "basics", label: "Basics" },
  { id: "enjoyment", anchor: "enjoyment", label: "Enjoyment" },
  { id: "execution", anchor: "execution", label: "Execution" },
  { id: "notes", anchor: "notes", label: "Notes" },
  { id: "preview", anchor: "preview-anchor", label: "Preview" },
];

export function EvaluationForm({
  workType,
  slug,
  title,
  art,
  genres,
  canDraft,
  hasEvaluation,
  dimensions,
  topics,
  platforms,
  defaults,
}: {
  workType: WorkType;
  slug: string;
  title: string;
  art: WorkArt;
  genres: Genre[];
  canDraft: boolean;
  hasEvaluation: boolean;
  dimensions: DimensionOption[];
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
    impression: string;
    reviewBody: string;
    reviewSections: StoredSection[];
    imported: boolean;
    importSourceName: string;
    importSourceUrl: string;
    judgments: Judgment[];
    observations: Observation[];
  } | null;
}) {
  const action = saveEvaluation.bind(null, workType, slug);
  const [state, formAction] = useActionState(action, {} as ActionState);
  const [active, setActive] = useState("basics");
  const [stickyTop, setStickyTop] = useState(88);
  const [impression, setImpression] = useState(defaults?.impression ?? "");
  const [imported, setImported] = useState(defaults?.imported ?? false);
  const [enjoyment, setEnjoyment] = useState(defaults?.enjoyment ?? "");
  const [execution, setExecution] = useState(defaults?.execution ?? "");
  const [lens, setLens] = useState(defaults?.lens ?? "");
  const [standard, setStandard] = useState(defaults?.standard ?? "");
  const [completion, setCompletion] = useState(defaults?.completion ?? "SUBSTANTIAL");
  const [playtime, setPlaytime] = useState(defaults?.playtime ?? "UNKNOWN");
  const [ownership, setOwnership] = useState(defaults?.ownership ?? "");
  const [platformId, setPlatformId] = useState(defaults?.platformId ?? "");
  const [judgments, setJudgments] = useState<Record<string, string>>(() => {
    const next: Record<string, string> = {};
    for (const judgment of defaults?.judgments ?? []) next[judgment.dimensionId] = judgment.stance;
    return next;
  });
  const [mattered, setMattered] = useState<Record<string, string>>(() => {
    const next: Record<string, string> = {};
    for (const judgment of defaults?.judgments ?? []) {
      if (judgment.mattered) next[judgment.dimensionId] = judgment.mattered;
    }
    return next;
  });
  const [judgedOrder, setJudgedOrder] = useState<string[]>(() => initialJudgedOrder(defaults));
  const [observations, setObservations] = useState<Observation[]>(
    defaults?.observations.length
      ? defaults.observations
      : [{ topicId: topics[0]?.id ?? "", polarity: "CRITICISM", content: "" }],
  );

  useEffect(() => {
    if (!state.error && !state.draftSaved) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    document.getElementById("builder-feedback")?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "nearest" });
  }, [state.error, state.draftSaved]);

  useEffect(() => {
    const header = document.querySelector(".site-header");
    const syncHeader = () => setStickyTop(Math.round(header?.getBoundingClientRect().height ?? 88));
    syncHeader();
    window.addEventListener("resize", syncHeader);
    return () => window.removeEventListener("resize", syncHeader);
  }, []);

  useEffect(() => {
    const update = () => {
      const line = stickyTop + 32;
      let current = steps[0].id;
      for (const step of steps) {
        const node = document.getElementById(step.anchor);
        if (!node) continue;
        if (node.getBoundingClientRect().top <= line) current = step.id;
      }
      setActive(current);
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [stickyTop]);

  const judged = useMemo(() => judgedDimensions(dimensions, judgments, judgedOrder), [dimensions, judgments, judgedOrder]);
  const enjoymentDimensions = dimensions.filter((dimension) => dimension.family === "ENJOYMENT");
  const workDimensions = dimensions.filter((dimension) => dimension.family !== "ENJOYMENT");
  const workAxes = axesFor(workDimensions, judgments, mattered);
  const enjoymentAxes = axesFor(enjoymentDimensions, judgments, mattered);
  const platformName = platforms.find((platform) => platform.id === platformId)?.name ?? "";
  const current = steps.find((step) => step.id === active) ?? steps[0];
  const currentIndex = steps.findIndex((step) => step.id === current.id) + 1;

  return (
    <form className="evaluation-builder" action={formAction}>
      <header className="builder-intro">
        <p className="kicker">Create your review</p>
        <h1>{workType === "MOVIE" ? "Movie" : "Game"}</h1>
      </header>

      <nav className="builder-track" aria-label="Evaluation sections">
        <ol className="builder-track-steps">
          {steps.map((step, index) => (
            <li key={step.id}>
              <button
                className="builder-step"
                type="button"
                aria-current={active === step.id ? "step" : undefined}
                onClick={() => scrollToStep(step.id)}
              >
                <span className="builder-index" aria-hidden="true">
                  {index + 1}
                </span>
                {step.label}
              </button>
            </li>
          ))}
        </ol>
        <p className="builder-track-compact">
          <span>{current.label}</span>
          <span>
            {currentIndex} of {steps.length}
          </span>
        </p>
      </nav>

      <div className="builder-sticky" style={{ top: stickyTop }} aria-hidden="true">
        <strong>{title}</strong>
        <p>
          <span>Enjoyment {isStance(enjoyment) ? stanceLabel[enjoyment] : "open"}</span>
          <span>Execution {isStance(execution) ? stanceLabel[execution] : "open"}</span>
        </p>
      </div>

      <div className="builder-columns">
      <div className="builder-main">
        {state.error ? (
          <p className="form-error" id="builder-feedback" role="alert">
            {state.error}
          </p>
        ) : null}
        {state.draftSaved ? (
          <p className="builder-status" id="builder-feedback" role="status">
            Draft saved. It stays off the work page until you publish.
          </p>
        ) : null}
        <section className="panel builder-section" id="basics" aria-labelledby="builder-basics">
          <header className="builder-section-head">
            <span className="builder-index" aria-hidden="true">
              1
            </span>
            <div>
              <h2 id="builder-basics">Work and basics</h2>
              <p className="meta">Start with the work you are evaluating, then the context of this judgment.</p>
            </div>
          </header>
          <div className="builder-work">
            <ArtImage art={art} shape="tall" className="builder-poster" />
            <div>
              <p className="builder-work-title">{title}</p>
              {genres.length > 0 ? (
                <ul className="impression-genres">
                  {genres.map((genre) => (
                    <li key={genre.slug}>
                      <a className="chip" href={`/discover?genre=${genre.slug}`}>
                        {genre.name}
                      </a>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          </div>
          <div className="builder-fields">
            <label className="field">
              <span>Platform</span>
              <select name="platformId" value={platformId} onChange={(event) => setPlatformId(event.target.value)}>
                <option value="">Not specified</option>
                {platforms.map((platform) => (
                  <option key={platform.id} value={platform.id}>
                    {platform.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>Approximate time</span>
              <select name="playtime" value={playtime} onChange={(event) => setPlaytime(event.target.value)}>
                {playtimes.map((value) => (
                  <option key={value} value={value}>
                    {playtimeLabel[value]}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>Completion</span>
              <select name="completion" value={completion} onChange={(event) => setCompletion(event.target.value)}>
                {completions.map((value) => (
                  <option key={value} value={value}>
                    {completionLabel[value]}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>How you had access</span>
              <select name="ownership" value={ownership} onChange={(event) => setOwnership(event.target.value)}>
                <option value="">Not specified</option>
                {ownerships.map((value) => (
                  <option key={value} value={value}>
                    {ownershipLabel[value]}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <fieldset>
            <legend className="legend">What were you primarily evaluating?</legend>
            <div className="choice-grid">
              <Choice name="lens" value="EXECUTION" checked={lens === "EXECUTION"} onChange={setLens} title="Execution" detail="Gameplay, craft, technical quality, whether it does what it attempts." />
              <Choice name="lens" value="EXPERIENCE" checked={lens === "EXPERIENCE"} onChange={setLens} title="Experience" detail="Story, artistic experience, or how it felt to spend time with it." />
              <Choice name="lens" value="MIXED" checked={lens === "MIXED"} onChange={setLens} title="A combination" detail="Execution and experience both shaped the judgment." />
            </div>
          </fieldset>
          <fieldset>
            <legend className="legend">Did the work’s circumstances affect your standards?</legend>
            <div className="choice-grid">
              <Choice name="standard" value="ABSOLUTE" checked={standard === "ABSOLUTE"} onChange={setStandard} title="No" detail="Essentially the same standards I use for other works." />
              <Choice name="standard" value="MIXED" checked={standard === "MIXED"} onChange={setStandard} title="Somewhat" detail="Context mattered, but it did not replace my usual standard." />
              <Choice name="standard" value="CONTEXTUAL" checked={standard === "CONTEXTUAL"} onChange={setStandard} title="Yes" detail="I consciously adjusted expectations." />
            </div>
            <label className="field">
              <span>If you adjusted, what circumstances mattered? Optional.</span>
              <input name="standardNote" maxLength={280} defaultValue={defaults?.standardNote ?? ""} />
            </label>
          </fieldset>
          <fieldset>
            <legend className="legend">Who is evaluating</legend>
            <p className="meta">An email keeps this evaluation attached to you on this server. It is not a verified login.</p>
            <div className="builder-fields">
              <label className="field">
                <span>Display name</span>
                <input name="displayName" required minLength={2} maxLength={48} defaultValue={defaults?.displayName ?? ""} autoComplete="name" />
              </label>
              <label className="field">
                <span>Email</span>
                <input name="email" type="email" required autoComplete="email" defaultValue={defaults?.email ?? ""} />
              </label>
            </div>
          </fieldset>
        </section>

        <section className="panel builder-section" id="enjoyment" aria-labelledby="builder-enjoyment">
          <header className="builder-section-head">
            <span className="builder-index" aria-hidden="true">
              2
            </span>
            <div>
              <h2 id="builder-enjoyment">Enjoyment</h2>
              <p className="meta">How it felt to spend time with the work. These stay off the chart.</p>
            </div>
          </header>
          <fieldset aria-labelledby="builder-enjoyment">
            <StancePills name="enjoyment" value={enjoyment} onChange={setEnjoyment} />
          </fieldset>
          <DimensionChoices
            legend="Enjoyment, if you want to be more specific"
            note="Leave a row as “Skip” when it did not matter or you don’t have a view. These are optional, and they stay separate from the headline."
            dimensions={enjoymentDimensions}
            values={judgments}
            mattered={mattered}
            onStance={(dimensionId, stance) => recordStance(setJudgments, setMattered, setJudgedOrder, dimensionId, stance)}
            onMattered={(dimensionId, next) => setMattered((current) => ({ ...current, [dimensionId]: next }))}
            split
          />
        </section>

        <section className="panel builder-section" id="execution" aria-labelledby="builder-execution">
          <header className="builder-section-head">
            <span className="builder-index" aria-hidden="true">
              3
            </span>
            <div>
              <h2 id="builder-execution">Execution</h2>
              <p className="meta">How the work was made. Judged rows are what the chart draws.</p>
            </div>
          </header>
          <fieldset>
            <legend className="legend">Was it well executed?</legend>
            <StancePills name="execution" value={execution} onChange={setExecution} />
          </fieldset>
          <DimensionChoices
            legend="Execution, if you want to be more specific"
            note="Leave a row as “Skip” when it did not matter or you don’t have a view. Three or more judged dimensions draw the radar."
            dimensions={workDimensions}
            values={judgments}
            mattered={mattered}
            onStance={(dimensionId, stance) => recordStance(setJudgments, setMattered, setJudgedOrder, dimensionId, stance)}
            onMattered={(dimensionId, next) => setMattered((current) => ({ ...current, [dimensionId]: next }))}
            split
          />
        </section>

        <section className="panel builder-section" id="notes" aria-labelledby="builder-notes">
          <header className="builder-section-head">
            <span className="builder-index" aria-hidden="true">
              4
            </span>
            <div>
              <h2 id="builder-notes">Notes</h2>
              <p className="meta">The quotable line, the review, and any specific thing you noticed.</p>
            </div>
          </header>
          <label className="choice">
            <input type="checkbox" name="imported" checked={imported} onChange={(event) => setImported(event.target.checked)} />
            <span>
              This text was written somewhere else
              <small>Imported reviews stay marked as imported.</small>
            </span>
          </label>
          <label className="field">
            <span>Overall impression</span>
            <input
              name="impression"
              maxLength={80}
              value={impression}
              onChange={(event) => setImpression(event.target.value)}
              placeholder="Two short clauses are enough."
            />
            <p className="meta">{impression.length}/80. One line someone could quote. Leave it blank if you would rather write the review.</p>
          </label>
          <label className="field">
            <span>Title, optional</span>
            <input name="reviewTitle" maxLength={140} defaultValue={defaults?.reviewTitle ?? ""} />
          </label>
          <ReviewComposer
            label="Review"
            judged={judged}
            catalog={dimensions}
            initialBody={defaults?.reviewBody ?? ""}
            initialSections={defaults?.reviewSections ?? []}
            forcedContinuous={imported}
          />
          <label className="field">
            <span>Original publication, if imported</span>
            <input name="importSourceName" maxLength={120} defaultValue={defaults?.importSourceName ?? ""} />
          </label>
          <label className="field">
            <span>Source URL, if imported</span>
            <input name="importSourceUrl" type="url" placeholder="https://" defaultValue={defaults?.importSourceUrl ?? ""} />
          </label>
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
                onClick={() => setObservations((rows) => [...rows, { topicId: topics[0]?.id ?? "", polarity: "CRITICISM", content: "" }])}
              >
                Add another observation
              </button>
            ) : null}
          </fieldset>
        </section>
        <div id="preview-anchor" className="builder-anchor" />
        {canDraft ? (
          <div className="builder-actions">
            <IntentButton intent="draft">Save draft</IntentButton>
          </div>
        ) : null}
      </div>

      <EvaluationPreview
        title={title}
        art={art}
        genres={genres}
        platformName={platformName}
        playtime={playtime}
        completion={completion}
        lens={lens}
        ownership={ownership}
        enjoyment={enjoyment}
        execution={execution}
        workAxes={workAxes}
        enjoymentAxes={enjoymentAxes}
        publishLabel={hasEvaluation && !canDraft ? "Update evaluation" : "Publish evaluation"}
      />
      </div>
    </form>
  );
}

function initialJudgedOrder(
  defaults: { reviewSections: StoredSection[]; judgments: { dimensionId: string }[] } | null,
): string[] {
  const seen = new Set<string>();
  const order: string[] = [];
  for (const section of defaults?.reviewSections ?? []) {
    if (!section.dimensionId || seen.has(section.dimensionId)) continue;
    seen.add(section.dimensionId);
    order.push(section.dimensionId);
  }
  for (const judgment of defaults?.judgments ?? []) {
    if (seen.has(judgment.dimensionId)) continue;
    seen.add(judgment.dimensionId);
    order.push(judgment.dimensionId);
  }
  return order;
}

function recordStance(
  setJudgments: Dispatch<SetStateAction<Record<string, string>>>,
  setMattered: Dispatch<SetStateAction<Record<string, string>>>,
  setOrder: Dispatch<SetStateAction<string[]>>,
  dimensionId: string,
  stance: string,
) {
  setJudgments((current) => ({ ...current, [dimensionId]: stance }));
  if (!stance) setMattered((current) => ({ ...current, [dimensionId]: "" }));
  setOrder((order) => rememberJudgment(order, dimensionId, stance));
}

function axesFor(dimensions: DimensionOption[], judgments: Record<string, string>, mattered: Record<string, string>): RadarAxis[] {
  return dimensions.flatMap((dimension) => {
    const stance = judgments[dimension.id];
    const weight = mattered[dimension.id] ?? "";
    return isStance(stance) && isMattered(weight) ? [{ name: dimension.name, stance, mattered: weight }] : [];
  });
}

function scrollToStep(id: string) {
  const narrow = window.matchMedia("(max-width: 1100px)").matches;
  const targetId = id === "preview" ? (narrow ? "preview" : "preview-anchor") : id;
  const node = document.getElementById(targetId);
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  node?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
}

function Choice({
  name,
  value,
  title,
  detail,
  checked,
  onChange,
}: {
  name: string;
  value: string;
  title: string;
  detail: string;
  checked: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <label className="choice">
      <input type="radio" name={name} value={value} checked={checked} onChange={() => onChange(value)} />
      <span>
        {title}
        <small>{detail}</small>
      </span>
    </label>
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
