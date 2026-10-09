import type { Metadata } from "next";
import { DM_Sans, Fraunces, IBM_Plex_Sans, Manrope, Source_Sans_3, Source_Serif_4, Space_Grotesk } from "next/font/google";
import { themeStylesheet } from "@/design-system/theme-css";
import { defaultMode, defaultMood } from "@/design-system/themes";
import { isColorMode, isThemeId } from "@/design-system/theme-types";
import { CompareProvider } from "@/components/comparison/compare-provider";
import { CompareTray } from "@/components/comparison/compare-controls";
import { ScrollToTop } from "@/components/navigation/scroll-to-top";
import { SiteFooter, SiteHeader } from "@/components/navigation/site-header";
import { getCurrentUser } from "@/lib/auth/session";
import "@/design-system/components.css";

const sourceSans = Source_Sans_3({ subsets: ["latin"], variable: "--font-source-sans" });
const dmSans = DM_Sans({ subsets: ["latin"], variable: "--font-dm-sans" });
const sourceSerif = Source_Serif_4({ subsets: ["latin"], variable: "--font-source-serif" });
const fraunces = Fraunces({ subsets: ["latin"], variable: "--font-fraunces" });
const manrope = Manrope({ subsets: ["latin"], variable: "--font-manrope" });
const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], variable: "--font-space-grotesk" });
const plex = IBM_Plex_Sans({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-plex" });

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: { default: "Frame", template: "%s · Frame" },
  description: "A review site that shows how a work was evaluated: enjoyment, execution, and the standard behind the judgment.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  const preferredMood = isThemeId(user?.preferences?.theme) ? user.preferences.theme : defaultMood();
  const preferredMode = isColorMode(user?.preferences?.colorMode) ? user.preferences.colorMode : defaultMode();
  const fromAccount = Boolean(user?.preferences?.theme || user?.preferences?.colorMode);
  const boot = `(function(){try{var root=document.documentElement;if(root.dataset.preference==="account")return;var mood=localStorage.getItem("frame-mood");var mode=localStorage.getItem("frame-mode");if(mood)root.dataset.mood=mood;if(mode)root.dataset.mode=mode;}catch(e){}})();`;

  return (
    <html
      lang="en"
      className={`${sourceSans.variable} ${dmSans.variable} ${sourceSerif.variable} ${fraunces.variable} ${manrope.variable} ${spaceGrotesk.variable} ${plex.variable}`}
      data-mood={preferredMood}
      data-mode={preferredMode}
      data-preference={fromAccount ? "account" : "local"}
      suppressHydrationWarning
    >
      <head>
        <style dangerouslySetInnerHTML={{ __html: themeStylesheet() }} />
        <script dangerouslySetInnerHTML={{ __html: boot }} />
      </head>
      <body>
        <CompareProvider>
          <a className="skip-link" href="#content">
            Skip to content
          </a>
          <SiteHeader mood={preferredMood} mode={preferredMode} editor={user?.role === "ADMIN" || user?.role === "EDITOR"} />
          <div id="content">{children}</div>
          <SiteFooter />
          <CompareTray />
          <ScrollToTop />
        </CompareProvider>
      </body>
    </html>
  );
}
