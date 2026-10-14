import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { SignupForm } from "@/components/auth/auth-forms";
import { getCurrentUser } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Create an account",
  description: "Create a Frame account with an email and a display name.",
};

export default async function SignupPage() {
  const user = await getCurrentUser();
  if (user) redirect("/dashboard");

  return (
    <main className="page shell">
      <div className="account-block">
        <p className="kicker">Account</p>
        <h1>Create an account</h1>
        <p className="lede">A display name is the public name on your evaluations. We email a 6-digit code. That is the whole setup.</p>
        <SignupForm />
        <p className="meta">
          Already have an account? <a href="/login">Sign in</a>
        </p>
      </div>
    </main>
  );
}
