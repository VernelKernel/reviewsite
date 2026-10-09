import type { Metadata } from "next";
import { ReviewCard } from "@/components/reviews/review-card";
import { PersonalShape } from "@/components/intake/personal-shape";
import { stanceClass, stanceLabel } from "@/lib/domain/labels";

export const metadata: Metadata = {
  title: "Personal review mockups",
  robots: { index: false, follow: false },
};

const axes = [
  { name: "Gameplay", stance: "MIXED" as const },
  { name: "Music", stance: "POSITIVE" as const },
  { name: "Controls", stance: "POSITIVE" as const },
  { name: "Game Design", stance: "MIXED" as const },
];

export default async function PersonalMockupPage({
  searchParams,
}: {
  searchParams: Promise<{ frame?: string }>;
}) {
  const frame = (await searchParams).frame;
  const showChart = frame !== "reading";
  const showReading = frame !== "chart";

  return (
    <main className="page shell mockup-sheet">
      {showChart ? (
      <section id="mockup-chart" className="mockup-frame" aria-labelledby="mockup-chart-title">
        <article className="mockup-chart-card">
          <div>
            <p className="kicker">Your evaluation</p>
            <h1 id="mockup-chart-title">ACE COMBAT 8: WINGS OF THEVE</h1>
            <p className="lede">Mixed on enjoyment. Mixed execution.</p>
          </div>
          <div className="personal-layout">
            <PersonalShape axes={axes} labelledBy="mockup-chart-title" />
            <div className="personal-readings">
              <Meter label="Enjoyment" stance="MIXED" />
              <Meter label="Execution" stance="MIXED" />
              <p className="meta">BonzoMan · PC</p>
            </div>
          </div>
          <p className="meta">Distance from the center is this evaluation’s stance. Unjudged dimensions are left off.</p>
        </article>
      </section>
      ) : null}

      {showReading ? (
      <section id="mockup-reading" className="mockup-frame">
        <ReviewCard
          linked={false}
          review={{
            workType: "GAME",
            workSlug: "ace-combat-8-wings-of-theve",
            reviewerName: "BonzoMan",
            reviewerSlug: "bonzoman",
            lens: "MIXED",
            standard: "ABSOLUTE",
            standardNote: null,
            enjoyment: "MIXED",
            execution: "MIXED",
            completion: "UNKNOWN",
            playtime: "TEN_TO_TWENTY_HOURS",
            ownership: "OWNED",
            platform: "PC",
            platformSlug: "pc",
            population: "AUDIENCE",
            reviewedOn: new Date("2026-10-05T14:36:41.000Z"),
            judgments: [
              { name: "Gameplay", stance: "MIXED" },
              { name: "Music", stance: "POSITIVE" },
              { name: "Controls", stance: "POSITIVE" },
              { name: "Game Design", stance: "MIXED" },
            ],
            observations: [
              {
                topic: "Controls",
                polarity: "PRAISE",
                content: "Flight controls are awesome and make you feel like a once in a generation pilot.",
              },
              {
                topic: "Music",
                polarity: "PRAISE",
                content: "The music is awesome in the phenomenal single-player campaign.",
              },
            ],
            review: {
              title: null,
              body: "TLDR: Play this game for the campaign and don’t touch the multiplayer.\n\nThe single player is phenomenal. The music, level design, and flight controls are all awesome. The game definitely makes you FEEL like you are a once in a generation pilot.\n\nThen you get to multiplayer. And Whoo boy… pay to win planes, some awkward hub area designed to sell you pilot cosmetics. And a grindy tech tree designed to encourage micro transactions. The game has been out about a week and the whales and sweat lords are already taking over lobbies.\n\nIt’s all designed to suck money out of you in the worst way possible. And that’s why it gets the not recommended for me. Until the adjust the multiplayer I’m gonna keep this negative review up. But seeing as they have a trend of just abandoning the multiplayer when it’s clearly not working I kinda doubt it.",
              source: "IMPORTED",
              importSourceName: "Steam",
              importSourceUrl: "https://steamcommunity.com/profiles/76561198134575241/recommended/2288340/",
            },
          }}
        />
      </section>
      ) : null}
    </main>
  );
}

function Meter({ label, stance }: { label: string; stance: string }) {
  return (
    <div className="personal-reading">
      <div className="personal-reading-head">
        <strong>{label}</strong>
        <span className={stanceClass(stance)}>{stanceLabel[stance]}</span>
      </div>
      <div className="personal-meter" aria-hidden="true">
        <span className={`personal-meter-fill personal-meter-${stance.toLowerCase()}`} />
      </div>
    </div>
  );
}
