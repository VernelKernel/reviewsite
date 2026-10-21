import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/auth/auth-forms";
import { safeReturnPath } from "@/lib/auth/return-path";
import { getCurrentUser } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to Frame with your username or email and password.",
};

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const next = safeReturnPath((await searchParams).next);
  const user = await getCurrentUser();
  if (user) redirect(next ?? "/dashboard");

  const nextQuery = next ? `?next=${encodeURIComponent(next)}` : "";
  return (
    <main className="page shell">
      <div className="account-block">
        <p className="kicker">Account</p>
        <h1>Sign in</h1>
        <p className="lede">Enter the username or email on the account, and its password.</p>
        <LoginForm next={next} />
        <p className="meta">
          New here? <a href={`/signup${nextQuery}`}>Create an account</a>
        </p>
      </div>
    </main>
  );
}
