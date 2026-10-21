import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { SignupForm } from "@/components/auth/auth-forms";
import { safeReturnPath } from "@/lib/auth/return-path";
import { getCurrentUser } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Create an account",
  description: "Create a Frame account with a username, email, and password.",
};

export default async function SignupPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const next = safeReturnPath((await searchParams).next);
  const user = await getCurrentUser();
  if (user) redirect(next ?? "/dashboard");

  const nextQuery = next ? `?next=${encodeURIComponent(next)}` : "";
  return (
    <main className="page shell">
      <div className="account-block">
        <p className="kicker">Account</p>
        <h1>Create an account</h1>
        <p className="lede">
          Choose a username, email, and password. We email a link to confirm the address. The account can sign in after that link is opened.
        </p>
        <SignupForm next={next} />
        <p className="meta">
          Already have an account? <a href={`/login${nextQuery}`}>Sign in</a>
        </p>
      </div>
    </main>
  );
}
