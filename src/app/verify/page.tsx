import type { Metadata } from "next";
import { VerifyCodeForm } from "@/components/auth/auth-forms";
import { readChallengeEmail } from "@/lib/auth/challenge-cookie";
import { safeReturnPath } from "@/lib/auth/return-path";

export const metadata: Metadata = {
  title: "Enter code",
  description: "Enter the 6-digit code from your email to finish signing in.",
};

export default async function VerifyPage({ searchParams }: { searchParams: Promise<{ notice?: string; next?: string }> }) {
  const params = await searchParams;
  const notice = params.notice;
  const next = safeReturnPath(params.next);
  const email = await readChallengeEmail();

  return (
    <main className="page shell">
      <div className="account-block">
        <p className="kicker">Account</p>
        <h1>Enter the code</h1>
        {email ? (
          <>
            {notice === "existing" ? (
              <p className="lede">This email already has an account. Enter the code to sign in.</p>
            ) : (
              <p className="lede">We sent a 6-digit code. Enter it here to finish.</p>
            )}
            <VerifyCodeForm email={email} next={next} />
          </>
        ) : (
          <>
            <p className="lede">Request a code from sign in or account creation. This page only accepts a code that was just sent.</p>
            <p className="meta">
              <a href="/login">Sign in</a>
              {" · "}
              <a href="/signup">Create an account</a>
            </p>
          </>
        )}
      </div>
    </main>
  );
}
