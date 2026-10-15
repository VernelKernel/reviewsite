import { workOgImage } from "@/lib/share/og-image";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "How critics and the audience evaluated this game on Frame";

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return workOgImage("GAME", slug);
}
