"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { confirmVerification, resendFromToken, type IntakeActionState } from "@/lib/intake/actions";

export function VerifyActions({ mode, token }: { mode: "confirm" | "resend"; token: string }) {
  const action = mode === "confirm" ? confirmVerification : resendFromToken;
  const [state, formAction] = useActionState(action, {} as IntakeActionState);

  return (
    <form action={formAction}>
      <input type="hidden" name="token" value={token} />
      {state.error ? (
        <p className="form-error" role="alert">
          {state.error}
        </p>
      ) : null}
      {state.devLink ? (
        <p className="meta">
          Development link: <a href={state.devLink}>{state.devLink}</a>
        </p>
      ) : null}
      {state.sent ? <p className="meta">Check your email for the new link.</p> : null}
      <PendingButton label={mode === "confirm" ? "Confirm email" : "Send a new link"} pendingLabel={mode === "confirm" ? "Confirming…" : "Sending link…"} />
    </form>
  );
}

function PendingButton({ label, pendingLabel }: { label: string; pendingLabel: string }) {
  const { pending } = useFormStatus();
  return (
    <button className="btn btn-primary" type="submit" disabled={pending} aria-busy={pending}>
      {pending ? pendingLabel : label}
    </button>
  );
}
