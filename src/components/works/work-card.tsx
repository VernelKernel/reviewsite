import { criticCoverage } from "@/lib/aggregation/landscape";
import { CompareButton } from "@/components/comparison/compare-controls";
import { audienceHref, criticsHref, workHref } from "@/lib/domain/labels";
import { ArtImage } from "@/components/works/work-art";
import { WorkCardCounts, WorkCardGroups } from "@/components/works/work-card-reading";
import { landscapesFor, workArt, type CardWork } from "@/lib/works/present";

export function WorkCard({ work }: { work: CardWork }) {
  const art = workArt(work.media);
  const landscapes = landscapesFor(work);
  return (
    <article className="work-card">
      <a className="work-card-link" href={workHref(work.workType, work.slug)}>
        <div className="work-card-media">
          <ArtImage art={art} shape="wide" />
        </div>
        <div className="work-card-body">
          <h3>{work.title}</h3>
          <WorkCardGroups
            critics={{ enjoyment: landscapes.critics.enjoyment, execution: landscapes.critics.execution }}
            audience={{ enjoyment: landscapes.audience.enjoyment, execution: landscapes.audience.execution }}
          />
        </div>
      </a>
      <WorkCardCounts
        criticHref={criticsHref(work.workType, work.slug)}
        audienceHref={audienceHref(work.workType, work.slug)}
        criticTip={criticCoverage(landscapes.critics.coverageCount)}
        audienceLabel={landscapes.audience.sampleNote.replace(/\.$/, "")}
      />
      <div className="work-card-actions">
        <CompareButton workType={work.workType} slug={work.slug} title={work.title} />
      </div>
    </article>
  );
}
