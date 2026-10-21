import { cookies } from "next/headers";
import type { Metadata } from "next";
import { AccountConfirmForm, AccountResendForm } from "@/components/auth/auth-forms";
import { ACCOUNT_VERIFY_COOKIE, accountTokenState } from "@/lib/auth/account";
import { readChallengeEmail } from "@/lib/auth/challenge-cookie";

export const metadata: Metadata = {
  title: "Confirm email",
  description: "Confirm the email address on a new Frame account.",
};

export default async function VerifyPage({ searchParams }: { searchParams: Promise<{ token?: string; notice?: string }> }) {
  const params = await searchParams;
  const token = params.token ?? "";
  const notice = params.notice;

  if (token) {
    const state = await accountTokenState(token);
    return (
      <main className="page shell">
        <div className="account-block">
          <p className="kicker">Account</p>
          {state.status === "missing" ? (
            <>
              <h1>This link is not valid.</h1>
              <p className="lede">Request a new link from the confirmation page, or create the account again.</p>
            </>
          ) : null}
          {state.status === "used" ? (
            <>
              <h1>This email is already confirmed.</h1>
              <p className="lede">
                <a href="/login">Sign in</a>
              </p>
            </>
          ) : null}
          {state.status === "expired" ? (
            <>
              <h1>This link has expired.</h1>
              <p className="lede">Send a new one to the same email. The account can sign in after you open it.</p>
              <AccountResendForm token={token} />
            </>
          ) : null}
          {state.status === "ready" ? (
            <>
              <h1>Confirm your email</h1>
              <p className="lede">This finishes the account and signs you in.</p>
              <AccountConfirmForm token={token} />
            </>
          ) : null}
        </div>
      </main>
    );
  }

  const email = await readChallengeEmail();
  const devLink = process.env.NODE_ENV === "production" ? null : ((await cookies()).get(ACCOUNT_VERIFY_COOKIE)?.value ?? null);

  return (
    <main className="page shell">
      <div className="account-block">
        <p className="kicker">Account</p>
        <h1>Check your email</h1>
        {email ? (
          <>
            {notice === "unverified" ? (
              <p className="lede">Confirm {email} before signing in. Open the link we sent, or send another. It expires in 24 hours.</p>
            ) : notice === "unsent" ? (
              <p className="lede">The account for {email} was created, and the confirmation email did not send. Send it again.</p>
            ) : (
              <p className="lede">We sent a confirmation link to {email}. It expires in 24 hours. Open it to finish the account and sign in.</p>
            )}
            <AccountResendForm devLink={devLink} />
          </>
        ) : (
          <>
            <p className="lede">Open the confirmation link from your email, or start again from account creation.</p>
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
