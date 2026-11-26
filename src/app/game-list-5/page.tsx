import type { Metadata } from "next";
import { GameListFivePanel } from "@/components/works/game-list-five-panel";
import { listGameSample } from "@/lib/works/queries";

export const metadata: Metadata = {
  title: "Game list",
  description: "Eight games, four to a row. Cover art above a quick look at enjoyment and execution shapes from published evaluations.",
  robots: { index: false, follow: false },
};

export default async function GameListFivePage() {
  const works = await listGameSample(8);
  return (
    <main className="page shell">
      <p className="kicker">Sample</p>
      <h1>Game list</h1>
      <div className="grid-cards emblem-grid list-five-grid">
        {works.map((work) => (
          <GameListFivePanel key={work.id} work={work} />
        ))}
      </div>
    </main>
  );
}
