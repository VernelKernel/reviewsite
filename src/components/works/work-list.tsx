import { PopulationModeProvider, PopulationModeToggle } from "@/components/works/population-mode";
import { WorkCard } from "@/components/works/work-card";
import type { CardWork } from "@/lib/works/queries";

export function WorkList({ works }: { works: CardWork[] }) {
  return (
    <PopulationModeProvider>
      <div className="work-list-bar">
        <PopulationModeToggle />
      </div>
      <div className="grid-cards">
        {works.map((work) => (
          <WorkCard key={work.id} work={work} />
        ))}
      </div>
    </PopulationModeProvider>
  );
}
