import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth/session";
import { loginCodeEmailHtml } from "@/lib/mail/send";

export const metadata: Metadata = {
  title: "Email preview",
  description: "Preview of the sign-in code email.",
  robots: { index: false, follow: false },
};

const SAMPLE_CODE = "482916";

export default async function EmailPreviewPage() {
  const user = await getCurrentUser();
  if (!user || (user.role !== "ADMIN" && user.role !== "EDITOR")) {
    return (
      <main className="page shell">
        <p className="kicker">Editor</p>
        <h1>Email preview</h1>
        <p className="lede">Sign in with an editor account to preview the sign-in code email.</p>
      </main>
    );
  }

  return (
    <main className="page shell">
      <div className="account-block account-block-wide">
        <p className="kicker">Editor</p>
        <h1>Sign-in code email</h1>
        <p className="lede">This is a sample. It is not a live sign-in code.</p>
        <iframe className="email-preview" title="Sign-in code email preview" sandbox="" srcDoc={loginCodeEmailHtml(SAMPLE_CODE)} />
      </div>
    </main>
  );
}
