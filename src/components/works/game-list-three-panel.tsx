import { CountTip } from "@/components/evaluations/distribution-bar";
import { criticCoverage, distributionLabel, type Distribution } from "@/lib/aggregation/landscape";
import { CompareButton } from "@/components/comparison/compare-controls";
import { CriticNestEmblem } from "@/components/evaluations/critic-nest-emblem";
import { ResetSpinButton, SpinClock } from "@/components/evaluations/spin-clock";
import { EmblemDownloads } from "@/components/works/emblem-downloads";
import { ArtImage } from "@/components/works/work-art";
import { audienceHref, criticsHref, workHref } from "@/lib/domain/labels";
import { landscapesFor, workArt, type CardWork } from "@/lib/works/present";

function ReadingPair({ enjoyment, execution }: { enjoyment: Distribution; execution: Distribution }) {
  return (
    <dl className="emblem-reading">
      <dt>Enjoyment:</dt>
      <dd>{distributionLabel(enjoyment)}</dd>
      <dt>Execution:</dt>
      <dd>{distributionLabel(execution)}</dd>
    </dl>
  );
}

function NestMark({
  enjoyment,
  execution,
  spin = true,
}: {
  enjoyment: Distribution;
  execution: Distribution;
  spin?: boolean;
}) {
  return <CriticNestEmblem compact decorative spin={spin} execution={execution} enjoyment={enjoyment} />;
}

export function GameListThreePanel({ work }: { work: CardWork }) {
  const art = workArt(work.media);
  const landscapes = landscapesFor(work);
  const critics = { enjoyment: landscapes.critics.enjoyment, execution: landscapes.critics.execution };
  const audience = { enjoyment: landscapes.audience.enjoyment, execution: landscapes.audience.execution };
  const coverSrc = art.tall?.src ?? art.wide?.src ?? null;

  return (
    <article className="work-card emblem-panel list-three">
      <SpinClock>
        <a className="work-card-link" href={workHref(work.workType, work.slug)}>
          <div className="list-three-head">
            <div className="list-three-cover">
              <div className="list-three-art">
                <ArtImage art={art} shape="tall" />
                <div className="list-three-badge">
                  <NestMark enjoyment={critics.enjoyment} execution={critics.execution} spin={false} />
                </div>
              </div>
            </div>
            <h3 className="list-three-title">{work.title}</h3>
          </div>
          <div className="snapshot">
            <section className="snapshot-group">
              <h4>Critics</h4>
              <div className="list-three-polygon">
                <NestMark enjoyment={critics.enjoyment} execution={critics.execution} />
              </div>
              <ReadingPair enjoyment={critics.enjoyment} execution={critics.execution} />
            </section>
            <section className="snapshot-group">
              <h4>Audience</h4>
              <div className="list-three-polygon">
                <NestMark enjoyment={audience.enjoyment} execution={audience.execution} />
              </div>
              <ReadingPair enjoyment={audience.enjoyment} execution={audience.execution} />
            </section>
          </div>
        </a>
        <p className="card-counts">
          <CountTip label="Critics" tip={criticCoverage(landscapes.critics.coverageCount)} href={criticsHref(work.workType, work.slug)} />
          <a href={audienceHref(work.workType, work.slug)}>{landscapes.audience.sampleNote.replace(/\.$/, "")}</a>
        </p>
        <div className="work-card-actions">
          <CompareButton workType={work.workType} slug={work.slug} title={work.title} />
          <div className="list-three-tools">
            <ResetSpinButton />
            <EmblemDownloads slug={work.slug} artSrc={coverSrc} mark="nest" reading={{ critics, audience }} />
          </div>
        </div>
      </SpinClock>
    </article>
  );
}
