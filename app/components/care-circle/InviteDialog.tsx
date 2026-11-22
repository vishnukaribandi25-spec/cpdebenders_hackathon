"use client";

import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { validateInvitationInput, type InvitationInput } from "../../lib/care-circle-store";

export interface InviteDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (input: InvitationInput) => void;
}

const FOCUS_RING =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2D7A6E]";

const INPUT_CLASS =
  "w-full rounded-xl border border-[#E3E8E6] bg-white px-3 py-2.5 text-sm text-[#1F2A28] placeholder:text-[#6B7673] focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-[#2D7A6E]";

const LABEL_CLASS = "text-sm font-semibold text-[#1F2A28]";
const ERROR_CLASS = "text-xs text-[#B42318]";

export default function InviteDialog({ open, onClose, onSubmit }: InviteDialogProps) {
  if (!open) return null;
  return <InviteDialogForm onClose={onClose} onSubmit={onSubmit} />;
}

// Mounted only while open, so every open starts from a fresh draft.
function InviteDialogForm({ onClose, onSubmit }: Omit<InviteDialogProps, "open">) {
  const baseId = useId();
  const headingId = `${baseId}-heading`;
  const nameId = `${baseId}-name`;
  const emailId = `${baseId}-email`;
  const roleId = `${baseId}-role`;
  const nameErrorId = `${nameId}-error`;
  const emailErrorId = `${emailId}-error`;
  const roleErrorId = `${roleId}-error`;

  const nameRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");
  const [submitted, setSubmitted] = useState(false);

  // Errors appear after the first submit attempt, then update live as the user types.
  const draft: InvitationInput = { name, email, role };
  const errors = submitted ? validateInvitationInput(draft) : {};

  useEffect(() => {
    nameRef.current?.focus();
  }, []);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);
    if (Object.keys(validateInvitationInput(draft)).length > 0) return;
    onSubmit({ name: name.trim(), email: email.trim(), role: role.trim() });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={headingId}
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white p-5 shadow-xl sm:p-6"
      >
        <h2 id={headingId} className="text-xl font-bold tracking-tight text-[#1F2A28]">
          Invite family member
        </h2>

        <form noValidate onSubmit={handleSubmit} className="mt-5 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor={nameId} className={LABEL_CLASS}>
              Name
            </label>
            <input
              id={nameId}
              ref={nameRef}
              type="text"
              required
              value={name}
              onChange={(event) => setName(event.target.value)}
              aria-invalid={errors.name ? true : undefined}
              aria-describedby={errors.name ? nameErrorId : undefined}
              className={INPUT_CLASS}
            />
            {errors.name && (
              <p id={nameErrorId} className={ERROR_CLASS}>
                {errors.name}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor={emailId} className={LABEL_CLASS}>
              Email
            </label>
            <input
              id={emailId}
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              aria-invalid={errors.email ? true : undefined}
              aria-describedby={errors.email ? emailErrorId : undefined}
              className={INPUT_CLASS}
            />
            {errors.email && (
              <p id={emailErrorId} className={ERROR_CLASS}>
                {errors.email}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor={roleId} className={LABEL_CLASS}>
              Role <span className="font-normal text-[#6B7673]">(optional)</span>
            </label>
            <input
              id={roleId}
              type="text"
              placeholder="e.g. Son, Daughter, Friend"
              value={role}
              onChange={(event) => setRole(event.target.value)}
              aria-invalid={errors.role ? true : undefined}
              aria-describedby={errors.role ? roleErrorId : undefined}
              className={INPUT_CLASS}
            />
            {errors.role && (
              <p id={roleErrorId} className={ERROR_CLASS}>
                {errors.role}
              </p>
            )}
          </div>

          <div className="mt-2 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              className={`rounded-xl border border-[#D5DEDA] bg-white px-4 py-2.5 text-sm font-semibold text-[#1F2A28] hover:bg-[#F4F6F5] ${FOCUS_RING}`}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`rounded-xl bg-[#2D7A6E] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#25655B] ${FOCUS_RING}`}
            >
              Save invitation
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
