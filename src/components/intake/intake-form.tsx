"use client";

import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import type { WorkType } from "@/generated/prisma/client";
import { DimensionChoices, type DimensionOption } from "@/components/evaluations/dimension-fields";
import { PersonalShape, type PersonalAxis } from "@/components/intake/personal-shape";
import { createIntake, type IntakeActionState } from "@/lib/intake/actions";
import { personalHeadline } from "@/lib/intake/judgments";
import { stanceClass, stanceLabel } from "@/lib/domain/labels";

const steps = [
  { id: "basics", anchor: "basics", label: "Basics" },
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
  const noun = workType === "MOVIE" ? "movie" : "game";
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

  const enjoymentDimensions = dimensions.filter((dimension) => dimension.family === "ENJOYMENT");
  const workDimensions = dimensions.filter((dimension) => dimension.family !== "ENJOYMENT");
  const workAxes = axesFor(workDimensions, judgments);
  const enjoymentAxes = axesFor(enjoymentDimensions, judgments);
  const current = steps.find((step) => step.id === active) ?? steps[0];
  const currentIndex = steps.findIndex((step) => step.id === current.id) + 1;
  const headline = isStance(enjoyment) && isStance(execution) ? personalHeadline(enjoyment, execution) : "Your chart updates as you answer.";
  const byline = [platform.trim(), genre.trim()].filter(Boolean);

  return (
    <form className="evaluation-builder" action={action}>
      <header className="builder-intro">
        <p className="kicker">Create your review</p>
        <h1>{workType === "MOVIE" ? "Movies" : "Games"}</h1>
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

          <section className="panel builder-section" id="basics" aria-labelledby="intake-basics">
            <header className="builder-section-head">
              <span className="builder-index" aria-hidden="true">
                1
              </span>
              <div>
                <h2 id="intake-basics">Work and basics</h2>
                <p className="meta">
                  Name the {noun}. <a href={otherHref}>Switch to {otherLabel}</a>
                </p>
              </div>
            </header>
            <label className="field">
              <span>Title</span>
              <input
                name="title"
                required
                minLength={2}
                maxLength={140}
                autoComplete="off"
                placeholder={`The ${noun} you evaluated`}
                value={title}
                onChange={(event) => setTitle(event.target.value)}
              />
            </label>
            <div className="builder-fields">
              <label className="field">
                <span>Platform, optional</span>
                <input name="platform" maxLength={80} autoComplete="off" value={platform} onChange={(event) => setPlatform(event.target.value)} />
              </label>
              <label className="field">
                <span>Genre, optional</span>
                <input name="genre" maxLength={80} autoComplete="off" value={genre} onChange={(event) => setGenre(event.target.value)} />
              </label>
            </div>
          </section>

          <section className="panel builder-section" id="enjoyment" aria-labelledby="intake-enjoyment">
            <header className="builder-section-head">
              <span className="builder-index" aria-hidden="true">
                2
              </span>
              <div>
                <h2 id="intake-enjoyment">Enjoyment</h2>
                <p className="meta">How it felt to spend time with it. These stay off the chart.</p>
              </div>
            </header>
            <fieldset>
              <legend className="legend">Did you enjoy it?</legend>
              <StancePills name="enjoyment" value={enjoyment} onChange={setEnjoyment} />
            </fieldset>
            <DimensionChoices
              legend="Enjoyment, if you want to be more specific"
              note="Leave a row as “Not judged” when you don’t have a view. These are optional, and they stay separate from the headline."
              dimensions={enjoymentDimensions}
              values={judgments}
              onStance={(dimensionId, stance) => setJudgments((current) => ({ ...current, [dimensionId]: stance }))}
              split
            />
          </section>

          <section className="panel builder-section" id="execution" aria-labelledby="intake-execution">
            <header className="builder-section-head">
              <span className="builder-index" aria-hidden="true">
                3
              </span>
              <div>
                <h2 id="intake-execution">Execution</h2>
                <p className="meta">How it was made. Judged rows are what the chart draws.</p>
              </div>
            </header>
            <fieldset>
              <legend className="legend">Was it well executed?</legend>
              <StancePills name="execution" value={execution} onChange={setExecution} />
            </fieldset>
            <DimensionChoices
              legend="Execution, if you want to be more specific"
              note="Leave a row as “Not judged” when you don’t have a view. Three or more judged dimensions draw the radar."
              dimensions={workDimensions}
              values={judgments}
              onStance={(dimensionId, stance) => setJudgments((current) => ({ ...current, [dimensionId]: stance }))}
              split
            />
          </section>

          <section className="panel builder-section" id="note" aria-labelledby="intake-note">
            <header className="builder-section-head">
              <span className="builder-index" aria-hidden="true">
                4
              </span>
              <div>
                <h2 id="intake-note">Note</h2>
                <p className="meta">Optional. A few sentences are enough.</p>
              </div>
            </header>
            <label className="field">
              <span>A note, optional</span>
              <textarea name="reviewBody" maxLength={8000} />
            </label>
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
              <p className="lede">{headline}</p>
              {byline.length > 0 ? (
                <p className="evaluation-byline">
                  {byline.map((item) => (
                    <span key={item}>{item}</span>
                  ))}
                </p>
              ) : null}
            </div>
            <div className="intake-preview-chart">
              <PersonalShape axes={workAxes} labelledBy="intake-preview-title" />
            </div>
            <section className="evaluation-panel" aria-labelledby="intake-key-impressions">
              <h2 id="intake-key-impressions">Key impressions</h2>
              {isStance(enjoyment) ? <StanceMeter label="Enjoyment" stance={enjoyment} /> : <p className="meta">Enjoyment is not judged yet.</p>}
              {enjoymentAxes.length > 0 ? (
                <ul className="dimension-breakdown" aria-label="Enjoyment dimensions">
                  {enjoymentAxes.map((axis) => (
                    <BreakdownRow key={axis.name} axis={axis} />
                  ))}
                </ul>
              ) : null}
              {isStance(execution) ? <StanceMeter label="Execution" stance={execution} /> : <p className="meta">Execution is not judged yet.</p>}
            </section>
            {workAxes.length > 0 ? (
              <section className="evaluation-panel" aria-labelledby="intake-dimension-breakdown">
                <h2 id="intake-dimension-breakdown">Dimension breakdown</h2>
                <ul className="dimension-breakdown">
                  {workAxes.map((axis) => (
                    <BreakdownRow key={axis.name} axis={axis} />
                  ))}
                </ul>
              </section>
            ) : null}
            <p className="builder-preview-note">
              Seeing the chart saves this review to you. Verifying an email unlocks the image and lets it join a work when the title matches.
            </p>
            <div className="builder-publish">
              <SeeChartButton />
            </div>
          </div>
        </aside>
      </div>
    </form>
  );
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

function scrollToStep(id: string) {
  const narrow = window.matchMedia("(max-width: 1100px)").matches;
  const targetId = id === "preview" ? (narrow ? "preview" : "preview-anchor") : id;
  const node = document.getElementById(targetId);
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  node?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
}

function StancePills({ name, value, onChange }: { name: string; value: string; onChange: (value: string) => void }) {
  return (
    <div className="stance-pills">
      {(["POSITIVE", "MIXED", "NEGATIVE"] as const).map((stance) => (
        <label className={`stance-pill stance-pill-${stance.toLowerCase()}`} key={stance}>
          <input type="radio" name={name} value={stance} required checked={value === stance} onChange={() => onChange(stance)} />
          <i className={`dimension-dot dimension-dot-${stance.toLowerCase()}`} aria-hidden="true" />
          <span>{stanceLabel[stance]}</span>
        </label>
      ))}
    </div>
  );
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
      <div className="stance-meter-track" role="img" aria-label={`${label}: ${stanceLabel[stance]}`}>
        <span className={`stance-meter-fill stance-meter-${stance.toLowerCase()}`} />
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
