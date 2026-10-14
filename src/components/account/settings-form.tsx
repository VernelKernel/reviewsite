"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { updateProfile, type AccountActionState } from "@/lib/account/actions";

export function SettingsForm({ displayName, bio }: { displayName: string; bio: string }) {
  const [state, action] = useActionState(updateProfile, {} as AccountActionState);
  return (
    <form className="form-layout account-form" action={action}>
      {state.error ? (
        <p className="form-error" role="alert">
          {state.error}
        </p>
      ) : null}
      {state.saved ? <p className="meta">Saved.</p> : null}
      <label className="field">
        <span>Display name</span>
        <input name="displayName" required minLength={2} maxLength={48} defaultValue={displayName} autoComplete="nickname" />
      </label>
      <label className="field">
        <span>Biography</span>
        <textarea name="bio" maxLength={600} rows={4} defaultValue={bio} />
      </label>
      <SaveButton />
    </form>
  );
}

function SaveButton() {
  const { pending } = useFormStatus();
  return (
    <button className="btn btn-primary" type="submit" disabled={pending} aria-busy={pending}>
      {pending ? "Saving…" : "Save profile"}
    </button>
  );
}
