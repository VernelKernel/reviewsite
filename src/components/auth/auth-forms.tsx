"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import {
  confirmAccountEmailAction,
  requestLogin,
  requestSignup,
  resendAccountVerificationAction,
  resendAccountVerificationFromTokenAction,
  type AuthActionState,
} from "@/lib/auth/actions";

function SubmitButton({ idle, pending }: { idle: string; pending: string }) {
  const status = useFormStatus();
  return (
    <button className="btn btn-primary" type="submit" disabled={status.pending} aria-busy={status.pending}>
      {status.pending ? pending : idle}
    </button>
  );
}

export function SignupForm({ next }: { next?: string | null }) {
  const [state, action] = useActionState(requestSignup, {} as AuthActionState);
  return (
    <form className="form-layout account-form" action={action}>
      {next ? <input type="hidden" name="next" value={next} /> : null}
      {state.error ? (
        <p className="form-error" role="alert">
          {state.error}
        </p>
      ) : null}
      <label className="field">
        <span>Username</span>
        <input
          name="username"
          required
          minLength={3}
          maxLength={24}
          autoComplete="username"
          spellCheck={false}
          aria-describedby="username-help"
        />
      </label>
      <p id="username-help" className="meta">
        3–24 characters. A letter first, then letters, numbers, or underscores. This is the public handle.
      </p>
      <label className="field">
        <span>Email</span>
        <input name="email" type="email" required autoComplete="email" maxLength={180} />
      </label>
      <label className="field">
        <span>Password</span>
        <input
          name="password"
          type="password"
          required
          minLength={8}
          maxLength={128}
          autoComplete="new-password"
          aria-describedby="password-help"
        />
      </label>
      <p id="password-help" className="meta">
        At least 8 characters.
      </p>
      <label className="field">
        <span>Confirm password</span>
        <input name="confirmPassword" type="password" required minLength={8} maxLength={128} autoComplete="new-password" />
      </label>
      <SubmitButton idle="Create account" pending="Creating account…" />
    </form>
  );
}

export function LoginForm({ next }: { next?: string | null }) {
  const [state, action] = useActionState(requestLogin, {} as AuthActionState);
  return (
    <form className="form-layout account-form" action={action}>
      {next ? <input type="hidden" name="next" value={next} /> : null}
      {state.error ? (
        <p className="form-error" role="alert">
          {state.error}
        </p>
      ) : null}
      <label className="field">
        <span>Username or email</span>
        <input name="identifier" required autoComplete="username" maxLength={180} />
      </label>
      <label className="field">
        <span>Password</span>
        <input name="password" type="password" required autoComplete="current-password" maxLength={128} />
      </label>
      <SubmitButton idle="Sign in" pending="Signing in…" />
    </form>
  );
}

export function AccountConfirmForm({ token }: { token: string }) {
  const [state, action] = useActionState(confirmAccountEmailAction, {} as AuthActionState);
  return (
    <form action={action}>
      <input type="hidden" name="token" value={token} />
      {state.error ? (
        <p className="form-error" role="alert">
          {state.error}
        </p>
      ) : null}
      <SubmitButton idle="Confirm email" pending="Confirming…" />
    </form>
  );
}

export function AccountResendForm({ devLink, token }: { devLink?: string | null; token?: string | null }) {
  const action = token ? resendAccountVerificationFromTokenAction : resendAccountVerificationAction;
  const [state, formAction] = useActionState(action, {} as AuthActionState);
  const link = state.devLink ?? devLink;

  return (
    <form action={formAction}>
      {token ? <input type="hidden" name="token" value={token} /> : null}
      {state.error ? (
        <p className="form-error" role="alert">
          {state.error}
        </p>
      ) : null}
      {state.sent ? <p className="meta">Check your email for the new link.</p> : null}
      {link ? (
        <p className="meta">
          Development link: <a href={link}>{link}</a>
        </p>
      ) : null}
      <ResendButton />
    </form>
  );
}

function ResendButton() {
  const { pending } = useFormStatus();
  return (
    <button className="btn btn-secondary" type="submit" disabled={pending} aria-busy={pending}>
      {pending ? "Sending link…" : "Send a new link"}
    </button>
  );
}
