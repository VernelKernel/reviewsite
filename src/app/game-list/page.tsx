import type { Metadata } from "next";
import { EmblemPanel } from "@/components/works/emblem-panel";
import { listGameSample } from "@/lib/works/queries";

export const metadata: Metadata = {
  title: "Game list",
  description: "Ten games, each with an emblem colored from its critic and audience evaluations.",
  robots: { index: false, follow: false },
};

export default async function GameListPage() {
  const works = await listGameSample(10);
  return (
    <main className="page shell">
      <p className="kicker">Sample</p>
      <h1>Game list</h1>
      <div className="grid-cards emblem-grid">
        {works.map((work) => (
          <EmblemPanel key={work.id} work={work} />
        ))}
      </div>
    </main>
  );
}
