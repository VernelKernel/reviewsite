import { ImageResponse } from "next/og";
import type { ReactNode } from "react";
import { defaultMood, themes } from "@/design-system/themes";
import type { WorkType } from "@/generated/prisma/client";
import { criticCoverage, percentages, type Distribution, type ReviewLandscape } from "@/lib/aggregation/landscape";
import { workTypeLabel } from "@/lib/domain/labels";
import { WATERMARK_LINE, WATERMARK_NAME } from "@/lib/share/targets";
import { getWork } from "@/lib/works/queries";
import { landscapesFor } from "@/lib/works/present";

export const OG_SIZE = { width: 1200, height: 630 };

type Colors = (typeof themes)["core"]["colors"]["light"];

export async function workOgImage(workType: WorkType, slug: string): Promise<ImageResponse> {
  const colors = themes[defaultMood()].colors.light;
  const work = await getWork(workType, slug);
  if (!work || work.status !== "PUBLISHED") {
    return new ImageResponse(
      <Frame colors={colors} kind="Games. Movies. What shape will your review take?" title={WATERMARK_NAME} />,
      OG_SIZE,
    );
  }
  const { critics, audience } = landscapesFor(work);
  const rows: { name: string; landscape: ReviewLandscape; count: string }[] = [];
  if (critics.sampleSize > 0) rows.push({ name: "Critics", landscape: critics, count: criticCoverage(critics.coverageCount) });
  if (audience.sampleSize > 0) {
    rows.push({
      name: "Audience",
      landscape: audience,
      count: `${audience.sampleSize} ${audience.sampleSize === 1 ? "evaluation" : "evaluations"}`,
    });
  }
  const title = work.title.length > 56 ? `${work.title.slice(0, 55)}…` : work.title;
  return new ImageResponse(
    <Frame colors={colors} kind={`${workTypeLabel[work.workType]} · FRAME Community`} title={title}>
      {rows.length === 0 ? (
        <div style={{ display: "flex", fontSize: 30, color: colors.chartGrid }}>No evaluations currently for this entry.</div>
      ) : (
        rows.map((row) => (
          <div key={row.name} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ display: "flex", fontSize: 26, fontWeight: 700 }}>
              {row.name}
              <span style={{ marginLeft: 14, fontWeight: 400, color: colors.chartGrid }}>{row.count}</span>
            </div>
            <div style={{ display: "flex", gap: 28 }}>
              <Bar colors={colors} label="Enjoyment" distribution={row.landscape.enjoyment} />
              <Bar colors={colors} label="Execution" distribution={row.landscape.execution} />
            </div>
          </div>
        ))
      )}
    </Frame>,
    OG_SIZE,
  );
}

function Frame({ colors, kind, title, children }: { colors: Colors; kind: string; title: string; children?: ReactNode }) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        padding: "56px 64px",
        color: colors.chartLabel,
        backgroundImage: `linear-gradient(165deg, ${colors.chartStage}, ${colors.chartStageEnd})`,
      }}
    >
      <div style={{ display: "flex", alignItems: "baseline", fontSize: 26 }}>
        <span style={{ fontWeight: 700, letterSpacing: 2 }}>{WATERMARK_NAME}</span>
        <span style={{ marginLeft: 16, color: colors.chartGrid }}>{WATERMARK_LINE}</span>
      </div>
      <div style={{ display: "flex", marginTop: 40, fontSize: 24, color: colors.chartGrid, textTransform: "uppercase", letterSpacing: 1 }}>
        {kind}
      </div>
      <div style={{ display: "flex", marginTop: 10, fontSize: 68, fontWeight: 700, lineHeight: 1.1 }}>{title}</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 26, marginTop: "auto" }}>{children}</div>
    </div>
  );
}

function Bar({ colors, label, distribution }: { colors: Colors; label: string; distribution: Distribution }) {
  const pct = percentages(distribution);
  return (
    <div style={{ display: "flex", flexDirection: "column", width: 520, gap: 8 }}>
      <div style={{ display: "flex", fontSize: 22 }}>{label}</div>
      <div style={{ display: "flex", height: 14, borderRadius: 7, overflow: "hidden", backgroundColor: colors.chartGrid }}>
        {distribution.count > 0 ? (
          <>
            <div style={{ display: "flex", width: `${pct.positive}%`, backgroundColor: colors.positive }} />
            <div style={{ display: "flex", width: `${pct.mixed}%`, backgroundColor: colors.caution }} />
            <div style={{ display: "flex", width: `${pct.negative}%`, backgroundColor: colors.negative }} />
          </>
        ) : null}
      </div>
      <div style={{ display: "flex", fontSize: 20, color: colors.chartGrid }}>
        {distribution.count > 0 ? `Positive ${pct.positive}% · Mixed ${pct.mixed}% · Negative ${pct.negative}%` : "No judgments yet"}
      </div>
    </div>
  );
}
