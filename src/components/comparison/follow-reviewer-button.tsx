"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { setReviewerFollow, type FollowState } from "@/lib/follows/actions";

export function FollowReviewerButton({ reviewerId, following }: { reviewerId: string; following: boolean }) {
  const [state, action] = useActionState(setReviewerFollow, {} as FollowState);
  return (
    <form className="inline-form" action={action}>
      <input type="hidden" name="reviewerId" value={reviewerId} />
      <input type="hidden" name="follow" value={following ? "0" : "1"} />
      <FollowSubmit following={following} error={state.error} />
    </form>
  );
}

function FollowSubmit({ following, error }: { following: boolean; error?: string }) {
  const { pending } = useFormStatus();
  return (
    <>
      <button className={following ? "btn btn-secondary" : "btn btn-primary"} type="submit" disabled={pending} aria-busy={pending}>
        {pending ? "Saving…" : following ? "Unfollow" : "Follow"}
      </button>
      {error ? (
        <span className="form-error" role="alert">
          {error}
        </span>
      ) : null}
    </>
  );
}
