import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth/session";
import { accountVerificationEmailHtml } from "@/lib/mail/send";

export const metadata: Metadata = {
  title: "Email preview",
  description: "Preview of the account confirmation email.",
  robots: { index: false, follow: false },
};

const SAMPLE_URL = "https://example.com/verify?token=sample";

export default async function EmailPreviewPage() {
  const user = await getCurrentUser();
  if (!user || (user.role !== "ADMIN" && user.role !== "EDITOR")) {
    return (
      <main className="page shell">
        <p className="kicker">Editor</p>
        <h1>Email preview</h1>
        <p className="lede">Sign in with an editor account to preview the account confirmation email.</p>
      </main>
    );
  }

  return (
    <main className="page shell">
      <div className="account-block account-block-wide">
        <p className="kicker">Editor</p>
        <h1>Account confirmation email</h1>
        <p className="lede">This is a sample. It is not a live confirmation link.</p>
        <iframe className="email-preview" title="Account confirmation email preview" sandbox="" srcDoc={accountVerificationEmailHtml(SAMPLE_URL)} />
      </div>
    </main>
  );
}
