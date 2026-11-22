"use client";

import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import type { CareAppointment } from "../../lib/appointment-types";
import { validateAppointmentInput, type AppointmentInput } from "../../lib/appointment-store";
import { careCircleMembers } from "../../lib/mock-data";

export interface AppointmentDialogProps {
  open: boolean;
  onClose: () => void;
  /** When set, the dialog edits this appointment instead of creating one. */
  initialAppointment?: CareAppointment;
  onSubmit: (input: AppointmentInput) => void;
}

const FOCUS_RING =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2D7A6E]";

const INPUT_CLASS =
  "w-full rounded-xl border border-[#E3E8E6] bg-white px-3 py-2.5 text-sm text-[#1F2A28] placeholder:text-[#6B7673] focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-[#2D7A6E]";

const LABEL_CLASS = "text-sm font-semibold text-[#1F2A28]";
const ERROR_CLASS = "text-xs text-[#B42318]";

/** Converts an ISO string to the local "YYYY-MM-DDTHH:mm" value used by datetime-local inputs. */
function toLocalInputValue(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours(),
  )}:${pad(date.getMinutes())}`;
}

export default function AppointmentDialog({ open, onClose, initialAppointment, onSubmit }: AppointmentDialogProps) {
  if (!open) return null;
  return <AppointmentDialogForm onClose={onClose} initialAppointment={initialAppointment} onSubmit={onSubmit} />;
}

// Mounted only while open, so every open starts from a fresh draft.
function AppointmentDialogForm({
  onClose,
  initialAppointment,
  onSubmit,
}: Omit<AppointmentDialogProps, "open">) {
  const titleId = useId();
  const titleErrorId = `${titleId}-title-error`;
  const startsErrorId = `${titleId}-starts-error`;
  const headingId = `${titleId}-heading`;

  const titleRef = useRef<HTMLInputElement>(null);
  const isEditing = initialAppointment !== undefined;

  const [title, setTitle] = useState(initialAppointment?.title ?? "");
  const [startsAt, setStartsAt] = useState(
    initialAppointment ? toLocalInputValue(initialAppointment.startsAt) : "",
  );
  const [location, setLocation] = useState(initialAppointment?.location ?? "");
  const [handledById, setHandledById] = useState(initialAppointment?.handledById ?? "");
  const [note, setNote] = useState(initialAppointment?.note ?? "");
  const [submitted, setSubmitted] = useState(false);

  // Errors appear after the first submit attempt, then update live as the user types.
  const draft: AppointmentInput = { title, startsAt, location, handledById, note };
  const errors = submitted ? validateAppointmentInput(draft) : {};

  useEffect(() => {
    titleRef.current?.focus();
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
    if (Object.keys(validateAppointmentInput(draft)).length > 0) return;
    onSubmit({
      ...draft,
      title: draft.title.trim(),
      location: draft.location.trim(),
      note: draft.note.trim(),
      startsAt: new Date(draft.startsAt).toISOString(),
    });
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
          {isEditing ? "Edit appointment" : "Add appointment"}
        </h2>

        <form noValidate onSubmit={handleSubmit} className="mt-5 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor={titleId} className={LABEL_CLASS}>
              Title
            </label>
            <input
              id={titleId}
              ref={titleRef}
              type="text"
              required
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              aria-invalid={errors.title ? true : undefined}
              aria-describedby={errors.title ? titleErrorId : undefined}
              className={INPUT_CLASS}
            />
            {errors.title && (
              <p id={titleErrorId} className={ERROR_CLASS}>
                {errors.title}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor={`${titleId}-starts`} className={LABEL_CLASS}>
              Date and time
            </label>
            <input
              id={`${titleId}-starts`}
              type="datetime-local"
              required
              value={startsAt}
              onChange={(event) => setStartsAt(event.target.value)}
              aria-invalid={errors.startsAt ? true : undefined}
              aria-describedby={errors.startsAt ? startsErrorId : undefined}
              className={INPUT_CLASS}
            />
            {errors.startsAt && (
              <p id={startsErrorId} className={ERROR_CLASS}>
                {errors.startsAt}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor={`${titleId}-location`} className={LABEL_CLASS}>
              Location
            </label>
            <input
              id={`${titleId}-location`}
              type="text"
              value={location}
              onChange={(event) => setLocation(event.target.value)}
              className={INPUT_CLASS}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor={`${titleId}-handler`} className={LABEL_CLASS}>
              Who handles it
            </label>
            <select
              id={`${titleId}-handler`}
              value={handledById}
              onChange={(event) => setHandledById(event.target.value)}
              className={INPUT_CLASS}
            >
              <option value="">Unassigned</option>
              {careCircleMembers.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor={`${titleId}-note`} className={LABEL_CLASS}>
              Note
            </label>
            <textarea
              id={`${titleId}-note`}
              rows={3}
              value={note}
              onChange={(event) => setNote(event.target.value)}
              className={INPUT_CLASS}
            />
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
              Save appointment
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
