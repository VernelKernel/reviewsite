"use client";

import { useActionState, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { deleteAccount, type AccountActionState } from "@/lib/account/actions";
import { ACCOUNT_DELETION_REASONS } from "@/lib/account/deletion-reasons";

export function DeleteAccountForm() {
  const [state, action, pending] = useActionState(deleteAccount, {} as AccountActionState);
  const [reason, setReason] = useState("");
  const [other, setOther] = useState("");
  const [open, setOpen] = useState(false);
  const [formError, setFormError] = useState("");
  const dialogRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const bodyId = useId();

  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    dialogRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setOpen(false);
      }
    };
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = overflow;
      document.removeEventListener("keydown", onKey);
      previous?.focus();
    };
  }, [open]);

  function continueToConfirm() {
    if (!reason) {
      setFormError("Choose a reason.");
      return;
    }
    if (reason === "OTHER" && other.trim().length < 2) {
      setFormError("Add a short note.");
      return;
    }
    setFormError("");
    setOpen(true);
  }

  const notice = formError || state.error;

  return (
    <form id="delete-account" className="account-form" action={action}>
      {notice ? (
        <p className="form-error" role="alert">
          {notice}
        </p>
      ) : null}
      <fieldset>
        <legend>Why are you deleting this account?</legend>
        <div className="choice-grid">
          {ACCOUNT_DELETION_REASONS.map((option) => (
            <label className="choice" key={option.value}>
              <input
                type="radio"
                name="reason-choice"
                value={option.value}
                checked={reason === option.value}
                onChange={() => setReason(option.value)}
              />
              <span>{option.label}</span>
            </label>
          ))}
        </div>
      </fieldset>
      {reason === "OTHER" ? (
        <label className="field">
          <span>Note</span>
          <textarea maxLength={500} rows={3} value={other} onChange={(event) => setOther(event.target.value)} />
        </label>
      ) : null}
      <input type="hidden" name="reason" value={reason} />
      <input type="hidden" name="otherText" value={reason === "OTHER" ? other : ""} />
      <button className="btn btn-secondary" type="button" onClick={continueToConfirm}>
        Continue
      </button>
      {open
        ? createPortal(
            <div className="confirm-backdrop">
              <button className="confirm-dismiss" type="button" aria-label="Cancel deletion" onClick={() => setOpen(false)} />
              <div
                className="confirm-dialog"
                role="dialog"
                aria-modal="true"
                aria-labelledby={titleId}
                aria-describedby={bodyId}
                tabIndex={-1}
                ref={dialogRef}
              >
                <h2 id={titleId}>Delete this account?</h2>
                <p id={bodyId}>
                  You will be signed out. This email can be used again. Published evaluations stay on your public reviewer page.
                </p>
                <div className="confirm-actions">
                  <button className="btn btn-secondary" type="button" onClick={() => setOpen(false)}>
                    Cancel
                  </button>
                  <button className="btn btn-primary" type="submit" form="delete-account" disabled={pending} aria-busy={pending}>
                    {pending ? "Deleting…" : "Delete account"}
                  </button>
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </form>
  );
}

