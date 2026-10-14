import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { SettingsForm } from "@/components/account/settings-form";
import { AppearanceControl } from "@/components/navigation/appearance-control";
import { defaultMode, defaultMood } from "@/design-system/themes";
import { isColorMode, isThemeId } from "@/design-system/theme-types";
import { getCurrentUser } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Settings",
  description: "Display name, biography, and appearance for your Frame account.",
};

export default async function SettingsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const mood = isThemeId(user.preferences?.theme) ? user.preferences.theme : defaultMood();
  const mode = isColorMode(user.preferences?.colorMode) ? user.preferences.colorMode : defaultMode();

  return (
    <main className="page shell">
      <div className="account-block">
        <p className="kicker">Account</p>
        <h1>Settings</h1>
        <p className="lede">The display name and biography appear on your public reviewer page. Email stays on the account.</p>
        <SettingsForm displayName={user.profile?.displayName ?? ""} bio={user.profile?.bio ?? ""} />
        <section className="account-section" aria-labelledby="appearance-heading">
          <h2 id="appearance-heading">Appearance</h2>
          <AppearanceControl mood={mood} mode={mode} />
        </section>
        <p className="meta">
          <a href="/settings/delete-account">Delete account</a>
        </p>
      </div>
    </main>
  );
}
