import type { Metadata } from "next";
import { GameListThreePanel } from "@/components/works/game-list-three-panel";
import { listGameSample } from "@/lib/works/queries";

export const metadata: Metadata = {
  title: "Game list",
  description: "Ten games. Cover art, with enjoyment and execution polygons drawn from published evaluations.",
  robots: { index: false, follow: false },
};

export default async function GameListThreePage() {
  const works = await listGameSample(10);
  return (
    <main className="page shell">
      <p className="kicker">Sample</p>
      <h1>Game list</h1>
      <div className="grid-cards emblem-grid list-three-grid">
        {works.map((work) => (
          <GameListThreePanel key={work.id} work={work} />
        ))}
      </div>
    </main>
  );
}
