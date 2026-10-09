import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { IntakeForm } from "@/components/intake/intake-form";
import { evaluationFormOptions } from "@/lib/works/queries";

export const metadata: Metadata = { title: "Create your review" };

export default async function NewReviewPage({ searchParams }: { searchParams: Promise<{ type?: string }> }) {
  const type = (await searchParams).type;
  if (type !== "game" && type !== "movie") {
    return (
      <main className="page shell">
        <section className="home-intro">
          <p className="kicker">Create your review</p>
          <h1 className="display">Games or movies</h1>
          <div className="home-actions">
            <a className="btn btn-primary btn-large" href="/review/new?type=game">
              Games
            </a>
            <a className="btn btn-primary btn-large" href="/review/new?type=movie">
              Movies
            </a>
          </div>
        </section>
      </main>
    );
  }
  const workType = type === "movie" ? "MOVIE" : "GAME";
  const options = await evaluationFormOptions(workType);
  return (
    <main className="page shell">
      <IntakeForm workType={workType} dimensions={options.dimensions.map((dimension) => ({ id: dimension.id, name: dimension.name }))} />
    </main>
  );
}
