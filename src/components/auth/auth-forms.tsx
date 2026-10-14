"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { requestLogin, requestSignup, resendLoginCodeAction, submitLoginCode, type AuthActionState } from "@/lib/auth/actions";

function SubmitButton({ idle, pending }: { idle: string; pending: string }) {
  const status = useFormStatus();
  return (
    <button className="btn btn-primary" type="submit" disabled={status.pending} aria-busy={status.pending}>
      {status.pending ? pending : idle}
    </button>
  );
}

export function SignupForm() {
  const [state, action] = useActionState(requestSignup, {} as AuthActionState);
  return (
    <form className="form-layout account-form" action={action}>
      {state.error ? (
        <p className="form-error" role="alert">
          {state.error}
        </p>
      ) : null}
      <label className="field">
        <span>Display name</span>
        <input name="displayName" required minLength={2} maxLength={48} autoComplete="nickname" />
      </label>
      <label className="field">
        <span>Email</span>
        <input name="email" type="email" required autoComplete="email" maxLength={180} />
      </label>
      <SubmitButton idle="Email me a code" pending="Sending code…" />
    </form>
  );
}

export function LoginForm() {
  const [state, action] = useActionState(requestLogin, {} as AuthActionState);
  return (
    <form className="form-layout account-form" action={action}>
      {state.error ? (
        <p className="form-error" role="alert">
          {state.error} {state.unknownEmail ? <a href="/signup">Create an account</a> : null}
        </p>
      ) : null}
      <label className="field">
        <span>Email</span>
        <input name="email" type="email" required autoComplete="email" maxLength={180} />
      </label>
      <SubmitButton idle="Email me a code" pending="Sending code…" />
    </form>
  );
}

export function VerifyCodeForm({ email }: { email: string }) {
  const [state, action] = useActionState(submitLoginCode, {} as AuthActionState);
  const [resend, resendAction] = useActionState(resendLoginCodeAction, {} as AuthActionState);
  const notice = state.error ?? resend.error;

  return (
    <div className="account-form">
      {notice ? (
        <p className="form-error" role="alert">
          {notice}
        </p>
      ) : null}
      <form className="form-layout" action={action}>
        <label className="field">
          <span>6-digit code</span>
          <input
            name="code"
            inputMode="numeric"
            autoComplete="one-time-code"
            required
            minLength={6}
            maxLength={7}
            autoFocus
            aria-describedby="code-help"
          />
        </label>
        <p id="code-help" className="meta">
          Sent to {email}. It expires in 10 minutes.
        </p>
        <SubmitButton idle="Confirm code" pending="Checking code…" />
      </form>
      <form action={resendAction}>
        <ResendButton />
      </form>
    </div>
  );
}

function ResendButton() {
  const { pending } = useFormStatus();
  return (
    <button className="btn btn-secondary" type="submit" disabled={pending} aria-busy={pending}>
      {pending ? "Sending code…" : "Resend code"}
    </button>
  );
}
