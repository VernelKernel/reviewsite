"use client";

import { useActionState, useEffect, useMemo, useState, type Dispatch, type FormEvent, type SetStateAction } from "react";
import { useFormStatus } from "react-dom";
import type { WorkType } from "@/generated/prisma/client";
import { DimensionChoices, type DimensionOption } from "@/components/evaluations/dimension-fields";
import { EvaluationGraph } from "@/components/evaluations/evaluation-graph";
import { StancePills } from "@/components/evaluations/stance-pills";
import { ReviewComposer } from "@/components/evaluations/review-composer";
import type { PersonalAxis } from "@/components/intake/personal-shape";
import { createIntake, type IntakeActionState } from "@/lib/intake/actions";
import { judgedDimensions, rememberJudgment } from "@/lib/reviews/sections";
import { stanceClass, stanceLabel } from "@/lib/domain/labels";

const steps = [
  { id: "basics", anchor: "basics", label: "Media" },
  { id: "enjoyment", anchor: "enjoyment", label: "Enjoyment" },
  { id: "execution", anchor: "execution", label: "Execution" },
  { id: "note", anchor: "note", label: "Note" },
  { id: "preview", anchor: "preview-anchor", label: "Preview" },
];

export function IntakeForm({ workType, dimensions }: { workType: WorkType; dimensions: DimensionOption[] }) {
  const [state, action] = useActionState(createIntake, {} as IntakeActionState);
  const [active, setActive] = useState("basics");
  const [stickyTop, setStickyTop] = useState(88);
  const [title, setTitle] = useState("");
  const [platform, setPlatform] = useState("");
  const [genre, setGenre] = useState("");
  const [enjoyment, setEnjoyment] = useState("");
  const [execution, setExecution] = useState("");
  const [judgments, setJudgments] = useState<Record<string, string>>({});
  const [judgedOrder, setJudgedOrder] = useState<string[]>([]);
  const [chartFeedback, setChartFeedback] = useState<string | null>(null);
  const otherHref = workType === "MOVIE" ? "/review/new?type=game" : "/review/new?type=movie";
  const otherLabel = workType === "MOVIE" ? "games" : "movies";

  useEffect(() => {
    if (!state.error) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    document.getElementById("builder-feedback")?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "nearest" });
  }, [state.error]);

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
  const workAxes = axesFor(workDimensions, judgments);
  const enjoymentAxes = axesFor(enjoymentDimensions, judgments);
  const current = steps.find((step) => step.id === active) ?? steps[0];
  const currentIndex = steps.findIndex((step) => step.id === current.id) + 1;
  const byline = [platform.trim(), genre.trim()].filter(Boolean);
  const titleMissing = title.trim().length < 2;
  const platformMissing = platform.trim().length === 0;
  const genreMissing = genre.trim().length === 0;
  const basicsMissing = titleMissing || platformMissing || genreMissing;
  const requirementMessage = chartRequirementMessage({
    titleMissing,
    platformMissing,
    genreMissing,
    enjoyment,
    execution,
    judgedEnjoyment: enjoymentAxes.length,
    judgedExecution: workAxes.length,
  });
  const showRequirements = chartFeedback !== null && requirementMessage !== null;

  function onCreateChart(event: FormEvent<HTMLFormElement>) {
    if (!requirementMessage) {
      setChartFeedback(null);
      return;
    }
    event.preventDefault();
    setChartFeedback(requirementMessage);
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const targetId = basicsMissing ? "basics" : !isStance(enjoyment) || enjoymentAxes.length < 3 ? "enjoyment" : "execution";
    document.getElementById(targetId)?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
  }

  return (
    <form className="evaluation-builder" action={action} noValidate onSubmit={onCreateChart}>
      <header className="builder-intro">
        <p className="kicker">Create your review</p>
        <h1>{workType === "MOVIE" ? "Movie" : "Game"}</h1>
      </header>

      <nav className="builder-track" aria-label="Review sections">
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
        <strong>{title.trim() || "Your review"}</strong>
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
          <input type="hidden" name="workType" value={workType} />

          <p className="builder-switch meta">
            <a href={otherHref}>Switch to {otherLabel}</a>
          </p>

          <section className="panel builder-section" id="basics" aria-labelledby="intake-basics">
            <header className="builder-section-head">
              <span className="builder-index" aria-hidden="true">
                1
              </span>
              <h2 id="intake-basics">Media</h2>
            </header>
            <label className="field">
              <span>Title</span>
              <input
                name="title"
                required
                minLength={2}
                maxLength={140}
                autoComplete="off"
                aria-invalid={showRequirements && titleMissing ? true : undefined}
                value={title}
                onChange={(event) => setTitle(event.target.value)}
              />
            </label>
            <div className="builder-fields">
              <label className="field">
                <span>Platform</span>
                <input
                  name="platform"
                  required
                  maxLength={80}
                  autoComplete="off"
                  aria-invalid={showRequirements && platformMissing ? true : undefined}
                  value={platform}
                  onChange={(event) => setPlatform(event.target.value)}
                />
              </label>
              <label className="field">
                <span>Genre</span>
                <input
                  name="genre"
                  required
                  maxLength={80}
                  autoComplete="off"
                  aria-invalid={showRequirements && genreMissing ? true : undefined}
                  value={genre}
                  onChange={(event) => setGenre(event.target.value)}
                />
              </label>
            </div>
          </section>

          <section className="panel builder-section" id="enjoyment" aria-labelledby="intake-enjoyment">
            <header className="builder-section-head">
              <span className="builder-index" aria-hidden="true">
                2
              </span>
              <h2 id="intake-enjoyment">Enjoyment</h2>
            </header>
            <fieldset>
              <legend className="legend">Did you enjoy it?</legend>
              <StancePills name="enjoyment" value={enjoyment} onChange={setEnjoyment} />
            </fieldset>
            <p className="meta">At least three dimensions are required.</p>
            {isStance(enjoyment) ? (
              <div className="dimension-group">
                <DimensionChoices
                  legend="Enjoyment, if you want to be more specific"
                  dimensions={enjoymentDimensions}
                  values={judgments}
                  onStance={(dimensionId, stance) => recordStance(setJudgments, setJudgedOrder, dimensionId, stance)}
                  split
                />
              </div>
            ) : null}
          </section>

          <section className="panel builder-section" id="execution" aria-labelledby="intake-execution">
            <header className="builder-section-head">
              <span className="builder-index" aria-hidden="true">
                3
              </span>
              <h2 id="intake-execution">Execution</h2>
            </header>
            <fieldset>
              <legend className="legend">Was it well executed?</legend>
              <StancePills name="execution" value={execution} onChange={setExecution} />
            </fieldset>
            <p className="meta">At least three dimensions are required.</p>
            {isStance(execution) ? (
              <div className="dimension-group">
                <DimensionChoices
                  legend="Execution, if you want to be more specific"
                  note="Leave a row as “Skip” when you don’t have a view."
                  dimensions={workDimensions}
                  values={judgments}
                  onStance={(dimensionId, stance) => recordStance(setJudgments, setJudgedOrder, dimensionId, stance)}
                  split
                />
              </div>
            ) : null}
          </section>

          <section className="panel builder-section" id="note" aria-labelledby="intake-note">
            <header className="builder-section-head">
              <span className="builder-index" aria-hidden="true">
                4
              </span>
              <div>
                <h2 id="intake-note">Review</h2>
                <p className="meta">Optional. A few sentences are enough.</p>
              </div>
            </header>
            <ReviewComposer label="Review" hideLabel judged={judged} catalog={dimensions} initialBody="" initialSections={[]} maxLength={8000} />
          </section>
          <div id="preview-anchor" className="builder-anchor" />
        </div>

        <aside className="builder-preview" id="preview" aria-label="Live preview">
          <div className="panel builder-preview-scroll">
            <header className="builder-preview-head">
              <p className="kicker">Live preview</p>
              <p className="meta">Your chart updates as you answer.</p>
            </header>
            <div>
              <p className="builder-work-title" id="intake-preview-title">
                {title.trim() || "Untitled"}
              </p>
              {byline.length > 0 ? (
                <p className="evaluation-byline">
                  {byline.map((item) => (
                    <span key={item}>{item}</span>
                  ))}
                </p>
              ) : null}
            </div>
            <EvaluationGraph
              fields={[
                { label: "Execution", stance: isStance(execution) ? execution : null, axes: workAxes },
                { label: "Enjoyment", stance: isStance(enjoyment) ? enjoyment : null, axes: enjoymentAxes },
              ]}
            />
            <section className="evaluation-panel" aria-labelledby="intake-key-impressions">
              <h2 id="intake-key-impressions">Key impressions</h2>
              <div className="preview-group">
                {isStance(enjoyment) ? <StanceMeter label="Enjoyment" stance={enjoyment} /> : <p className="meta">Enjoyment not selected</p>}
                {isStance(enjoyment) && enjoymentAxes.length > 0 ? (
                  <div className="preview-breakdown">
                    <h2 className="preview-dimension-label" id="intake-enjoyment-dimension">
                      Dimension
                    </h2>
                    <ul className="dimension-breakdown" aria-label="Enjoyment dimensions">
                      {enjoymentAxes.map((axis) => (
                        <BreakdownRow key={axis.name} axis={axis} />
                      ))}
                    </ul>
                  </div>
                ) : null}
              </div>
              <div className="preview-group">
                {isStance(execution) ? <StanceMeter label="Execution" stance={execution} /> : <p className="meta">Execution not selected</p>}
                {isStance(execution) && workAxes.length > 0 ? (
                  <div className="preview-breakdown">
                    <h2 className="preview-dimension-label" id="intake-dimension-breakdown">
                      Dimension
                    </h2>
                    <ul className="dimension-breakdown">
                      {workAxes.map((axis) => (
                        <BreakdownRow key={axis.name} axis={axis} />
                      ))}
                    </ul>
                  </div>
                ) : null}
              </div>
            </section>
            <div className="builder-publish">
              {showRequirements ? (
                <p className="form-error" id="chart-requirements" role="alert">
                  {requirementMessage}
                </p>
              ) : null}
              <SeeChartButton />
            </div>
          </div>
        </aside>
      </div>
    </form>
  );
}

function recordStance(
  setJudgments: Dispatch<SetStateAction<Record<string, string>>>,
  setOrder: Dispatch<SetStateAction<string[]>>,
  dimensionId: string,
  stance: string,
) {
  setJudgments((current) => ({ ...current, [dimensionId]: stance }));
  setOrder((order) => rememberJudgment(order, dimensionId, stance));
}

function axesFor(dimensions: DimensionOption[], judgments: Record<string, string>): PersonalAxis[] {
  return dimensions.flatMap((dimension) => {
    const stance = judgments[dimension.id];
    return isStance(stance) ? [{ name: dimension.name, stance }] : [];
  });
}

function isStance(value: string): value is PersonalAxis["stance"] {
  return value === "POSITIVE" || value === "MIXED" || value === "NEGATIVE";
}

function chartRequirementMessage({
  titleMissing,
  platformMissing,
  genreMissing,
  enjoyment,
  execution,
  judgedEnjoyment,
  judgedExecution,
}: {
  titleMissing: boolean;
  platformMissing: boolean;
  genreMissing: boolean;
  enjoyment: string;
  execution: string;
  judgedEnjoyment: number;
  judgedExecution: number;
}): string | null {
  const missing: string[] = [];
  const fields = [titleMissing ? "Title" : null, platformMissing ? "Platform" : null, genreMissing ? "Genre" : null].filter(
    (field): field is string => Boolean(field),
  );
  if (fields.length === 1) missing.push(`${fields[0]} is required.`);
  if (fields.length > 1) missing.push(`${fields.slice(0, -1).join(", ")} and ${fields[fields.length - 1]} are required.`);
  if (!isStance(enjoyment) || !isStance(execution)) missing.push("Answer enjoyment and execution.");
  if (judgedEnjoyment < 3 || judgedExecution < 3) missing.push("At least three dimensions are required.");
  return missing.length > 0 ? missing.join(" ") : null;
}

function scrollToStep(id: string) {
  const narrow = window.matchMedia("(max-width: 1100px)").matches;
  const targetId = id === "preview" ? (narrow ? "preview" : "preview-anchor") : id;
  const node = document.getElementById(targetId);
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  node?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
}

function BreakdownRow({ axis }: { axis: PersonalAxis }) {
  return (
    <li>
      <i className={`dimension-dot dimension-dot-${axis.stance.toLowerCase()}`} aria-hidden="true" />
      <span>{axis.name}</span>
      <span className={stanceClass(axis.stance)}>{stanceLabel[axis.stance]}</span>
    </li>
  );
}

function StanceMeter({ label, stance }: { label: string; stance: PersonalAxis["stance"] }) {
  const icon = label === "Enjoyment" ? "heart" : "gear";
  return (
    <div className="stance-meter">
      <div className="stance-meter-head">
        <strong>
          <i className="flair-icon" data-icon={icon} aria-hidden="true" />
          {label}
        </strong>
        <span className={stanceClass(stance)}>{stanceLabel[stance]}</span>
      </div>
    </div>
  );
}

function SeeChartButton() {
  const { pending } = useFormStatus();
  return (
    <button className="btn btn-primary" type="submit" disabled={pending} aria-busy={pending}>
      {pending ? "Saving your review…" : "See your chart"}
    </button>
  );
}
