import type { Metadata } from "next";
import { GameListSixPanel } from "@/components/works/game-list-six-panel";
import { listGameSample } from "@/lib/works/queries";

export const metadata: Metadata = {
  title: "Game list",
  description: "Eight games, four to a row, with room on the right for a wide skyscraper. Cover art, critic shapes, and the stance of published reviews.",
  robots: { index: false, follow: false },
};

export default async function GameListSixPage() {
  const works = await listGameSample(8);
  return (
    <main className="page shell">
      <div className="list-four-stage">
        <div className="list-four-main">
          <p className="kicker">Sample</p>
          <h1>Game list</h1>
          <div className="grid-cards emblem-grid list-four-grid">
            {works.map((work) => (
              <GameListSixPanel key={work.id} work={work} />
            ))}
          </div>
        </div>
        <div className="list-four-ad-slot" aria-hidden="true" />
      </div>
    </main>
  );
}
