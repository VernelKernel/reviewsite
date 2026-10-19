import type { Metadata } from "next";
import { EmblemPanel } from "@/components/works/emblem-panel";
import { listGameSample } from "@/lib/works/queries";

export const metadata: Metadata = {
  title: "Game list",
  description: "Ten games, each with a critic emblem: execution around enjoyment.",
  robots: { index: false, follow: false },
};

export default async function GameListTwoPage() {
  const works = await listGameSample(10);
  return (
    <main className="page shell">
      <p className="kicker">Sample</p>
      <h1>Game list</h1>
      <div className="grid-cards emblem-grid">
        {works.map((work) => (
          <EmblemPanel key={work.id} work={work} mark="nest" />
        ))}
      </div>
    </main>
  );
}
