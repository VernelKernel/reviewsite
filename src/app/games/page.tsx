import type { Metadata } from "next";
import { WorkList } from "@/components/works/work-list";
import { listWorks } from "@/lib/works/queries";

export const metadata: Metadata = {
  title: "Games",
  description: "Games and other works with structured evaluations instead of a single score.",
};

export default async function GamesPage() {
  const works = await listWorks();
  return (
    <main className="page shell">
      <p className="kicker">Catalog</p>
      <h1>Games</h1>
      <WorkList works={works} />
    </main>
  );
}
