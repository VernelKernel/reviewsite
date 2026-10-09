import { VerifyActions } from "@/components/intake/verify-actions";
import { intakeTokenState } from "@/lib/intake/actions";

export default async function VerifyPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const token = (await searchParams).token ?? "";
  const state = await intakeTokenState(token);

  return (
    <main className="page shell">
      <section className="home-intro">
        <p className="kicker">Verify</p>
        {state.status === "missing" ? (
          <>
            <h1>This link is not valid.</h1>
            <p className="lede">Request a new link from your review chart.</p>
          </>
        ) : null}
        {state.status === "used" ? (
          <>
            <h1>This email is already verified.</h1>
            <p className="lede">
              <a href={`/review/${state.intakeId}`}>Return to your chart</a>
            </p>
          </>
        ) : null}
        {state.status === "expired" ? (
          <>
            <h1>This link has expired.</h1>
            <p className="lede">Send a new one to the same email. Nothing is published until you open the new link.</p>
            <VerifyActions mode="resend" token={token} />
          </>
        ) : null}
        {state.status === "ready" ? (
          <>
            <h1>Confirm your email</h1>
            <p className="lede">This unlocks the chart download and starts matching your title to a work.</p>
            <VerifyActions mode="confirm" token={token} />
          </>
        ) : null}
      </section>
    </main>
  );
}
