import type { Metadata } from "next";
import { IntakePreview } from "@/components/intake/intake-preview";
import type { PersonalAxis } from "@/components/intake/personal-shape";

export const metadata: Metadata = {
  title: "Castlevania: Belmont's Curse, your review",
  robots: { index: false, follow: false },
};

const enjoymentAxes: PersonalAxis[] = [
  { name: "Engagement", stance: "POSITIVE", mattered: "MATTERS_A_LOT" },
  { name: "Fun", stance: "POSITIVE", mattered: "MATTERS_A_LOT" },
  { name: "Immersion", stance: "POSITIVE", mattered: "QUITE_A_BIT" },
];

const workAxes: PersonalAxis[] = [
  { name: "Gameplay", stance: "POSITIVE", mattered: "MATTERS_A_LOT" },
  { name: "Story", stance: "MIXED", mattered: "QUITE_A_BIT" },
  { name: "Music", stance: "POSITIVE", mattered: "MATTERS_A_LOT" },
  { name: "Art direction", stance: "POSITIVE", mattered: "QUITE_A_BIT" },
  { name: "Technical quality", stance: "NEGATIVE", mattered: "A_LITTLE" },
  { name: "Atmosphere", stance: "POSITIVE", mattered: "MATTERS_A_LOT" },
];

export default function ReviewMockupPage() {
  return (
    <main className="page shell mockup-sheet">
      <h1 className="sr-only">Castlevania: Belmont's Curse</h1>
      <div className="evaluation-builder mockup-funnel">
        <IntakePreview
          title="Castlevania: Belmont's Curse"
          byline={["PC", "Action"]}
          enjoyment="POSITIVE"
          execution="MIXED"
          enjoymentAxes={enjoymentAxes}
          workAxes={workAxes}
          glance={[
            { value: "PC", label: "Platform", icon: "gamepad" },
            { value: "Completed", label: "Completion", icon: "replay" },
            { value: "Owned", label: "Access", icon: "lock" },
          ]}
        />
      </div>
    </main>
  );
}
