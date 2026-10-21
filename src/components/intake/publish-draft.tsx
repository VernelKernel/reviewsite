"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { publishIntakeDraft, type IntakeActionState } from "@/lib/intake/actions";

export function PublishDraft({ intakeId }: { intakeId: string }) {
  const action = publishIntakeDraft.bind(null, intakeId);
  const [state, formAction] = useActionState(action, {} as IntakeActionState);

  return (
    <form action={formAction}>
      {state.error ? (
        <p className="form-error" role="alert">
          {state.error}
        </p>
      ) : null}
      <PublishButton />
    </form>
  );
}

function PublishButton() {
  const { pending } = useFormStatus();
  return (
    <button className="btn btn-primary" type="submit" disabled={pending} aria-busy={pending}>
      {pending ? "Publishing review…" : "Publish review"}
    </button>
  );
}
