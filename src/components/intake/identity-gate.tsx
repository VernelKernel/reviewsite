"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { requestVerification, resendVerification, type IntakeActionState } from "@/lib/intake/actions";

export function IdentityGate({ intakeId, emailPending }: { intakeId: string; emailPending: boolean }) {
  const request = requestVerification.bind(null, intakeId);
  const [state, action] = useActionState(request, {} as IntakeActionState);
  const [resend, resendAction] = useActionState(async (_previous: IntakeActionState) => resendVerification(intakeId), {} as IntakeActionState);
  const notice = state.error ?? resend.error;
  const sent = state.sent || resend.sent;
  const devLink = state.devLink ?? resend.devLink;

  return (
    <section className="panel" aria-labelledby="verify-heading">
      <h2 id="verify-heading">Save and download</h2>
      <p className="meta">
        The chart is ready. Verifying an email unlocks the image and lets this review join a work when the title matches.
      </p>
      {notice ? (
        <p className="form-error" role="alert">
          {notice}
        </p>
      ) : null}
      {sent ? <p className="meta">Check your email for the verification link.</p> : null}
      {devLink ? (
        <p className="meta">
          Development link: <a href={devLink}>{devLink}</a>
        </p>
      ) : null}
      {emailPending || sent ? (
        <form action={resendAction}>
          <ResendButton />
        </form>
      ) : (
        <form className="form-layout" action={action}>
          <label className="field">
            <span>Display name</span>
            <input name="displayName" required minLength={2} maxLength={48} />
          </label>
          <label className="field">
            <span>Email</span>
            <input name="email" type="email" required autoComplete="email" />
          </label>
          <VerifyButton />
        </form>
      )}
    </section>
  );
}

function VerifyButton() {
  const { pending } = useFormStatus();
  return (
    <button className="btn btn-primary" type="submit" disabled={pending} aria-busy={pending}>
      {pending ? "Sending link…" : "Email me a verification link"}
    </button>
  );
}

function ResendButton() {
  const { pending } = useFormStatus();
  return (
    <button className="btn btn-secondary" type="submit" disabled={pending} aria-busy={pending}>
      {pending ? "Sending link…" : "Resend verification link"}
    </button>
  );
}
