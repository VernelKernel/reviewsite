import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/auth/auth-forms";
import { getCurrentUser } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to Frame with a code sent to your email.",
};

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) redirect("/dashboard");

  return (
    <main className="page shell">
      <div className="account-block">
        <p className="kicker">Account</p>
        <h1>Sign in</h1>
        <p className="lede">Enter the email on the account. We will send a 6-digit code.</p>
        <LoginForm />
        <p className="meta">
          New here? <a href="/signup">Create an account</a>
        </p>
      </div>
    </main>
  );
}
