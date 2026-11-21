"use client";

import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { validateTaskInput, type CreateTaskInput } from "../../lib/task-store";
import type { Member, Priority, Task } from "../../lib/types";

export interface TaskDialogProps {
  open: boolean;
  onClose: () => void;
  /** When set, the dialog edits this task instead of creating one. */
  initialTask?: Task;
  members: Member[];
  onSubmit: (input: CreateTaskInput) => void;
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

export default function TaskDialog({ open, onClose, initialTask, members, onSubmit }: TaskDialogProps) {
  if (!open) return null;
  return <TaskDialogForm onClose={onClose} initialTask={initialTask} members={members} onSubmit={onSubmit} />;
}

// Mounted only while open, so every open starts from a fresh draft.
function TaskDialogForm({
  onClose,
  initialTask,
  members,
  onSubmit,
}: Omit<TaskDialogProps, "open">) {
  const titleId = useId();
  const titleErrorId = `${titleId}-title-error`;
  const dueErrorId = `${titleId}-due-error`;
  const priorityErrorId = `${titleId}-priority-error`;
  const headingId = `${titleId}-heading`;

  const titleRef = useRef<HTMLInputElement>(null);
  const isEditing = initialTask !== undefined;

  const [title, setTitle] = useState(initialTask?.title ?? "");
  const [description, setDescription] = useState(initialTask?.description ?? "");
  const [assigneeId, setAssigneeId] = useState(initialTask?.assigneeId ?? "");
  const [dueAt, setDueAt] = useState(initialTask ? toLocalInputValue(initialTask.dueAt) : "");
  const [priority, setPriority] = useState<Priority>(initialTask?.priority ?? "medium");
  const [submitted, setSubmitted] = useState(false);

  // Errors appear after the first submit attempt, then update live as the user types.
  const draft: CreateTaskInput = {
    title,
    description,
    assigneeId: assigneeId === "" ? null : assigneeId,
    dueAt,
    priority,
  };
  const errors = submitted ? validateTaskInput(draft) : {};

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
    if (Object.keys(validateTaskInput(draft)).length > 0) return;
    onSubmit({
      ...draft,
      title: draft.title.trim(),
      description: draft.description.trim(),
      dueAt: new Date(draft.dueAt).toISOString(),
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
          {isEditing ? "Edit care task" : "Add care task"}
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
            <label htmlFor={`${titleId}-description`} className={LABEL_CLASS}>
              Description
            </label>
            <textarea
              id={`${titleId}-description`}
              rows={3}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              className={INPUT_CLASS}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor={`${titleId}-assignee`} className={LABEL_CLASS}>
              Assignee
            </label>
            <select
              id={`${titleId}-assignee`}
              value={assigneeId}
              onChange={(event) => setAssigneeId(event.target.value)}
              className={INPUT_CLASS}
            >
              <option value="">Unassigned</option>
              {members.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor={`${titleId}-due`} className={LABEL_CLASS}>
              Due date and time
            </label>
            <input
              id={`${titleId}-due`}
              type="datetime-local"
              required
              value={dueAt}
              onChange={(event) => setDueAt(event.target.value)}
              aria-invalid={errors.dueAt ? true : undefined}
              aria-describedby={errors.dueAt ? dueErrorId : undefined}
              className={INPUT_CLASS}
            />
            {errors.dueAt && (
              <p id={dueErrorId} className={ERROR_CLASS}>
                {errors.dueAt}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor={`${titleId}-priority`} className={LABEL_CLASS}>
              Priority
            </label>
            <select
              id={`${titleId}-priority`}
              value={priority}
              onChange={(event) => setPriority(event.target.value as Priority)}
              aria-invalid={errors.priority ? true : undefined}
              aria-describedby={errors.priority ? priorityErrorId : undefined}
              className={INPUT_CLASS}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
            {errors.priority && (
              <p id={priorityErrorId} className={ERROR_CLASS}>
                {errors.priority}
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
              Save task
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
