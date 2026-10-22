import type { Metadata } from "next";
import { workArt } from "@/lib/works/present";
import { getWork } from "@/lib/works/queries";
import { ShareCardSample } from "./share-card-sample";

export const metadata: Metadata = {
  title: "Castlevania: Belmont's Curse share card",
  robots: { index: false, follow: false },
};

export default async function ShareMockupPage() {
  const work = await getWork("GAME", "castlevania-belmont-s-curse");
  const art = workArt(work?.media ?? []);
  return (
    <main className="page shell mockup-sheet">
      <h1 className="sr-only">Castlevania: Belmont's Curse</h1>
      <ShareCardSample coverSrc={art.tall?.src ?? art.wide?.src ?? null} />
    </main>
  );
}
