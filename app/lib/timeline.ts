// Pure timeline helper. No React and no storage access. The timeline is a
// derived view over tasks and appointments, so nothing is persisted here.

import type { CareAppointment } from "./appointment-types";
import type { Task } from "./types";

export type TimelineEventKind = "task" | "appointment";

export interface TimelineEvent {
  id: string;
  kind: TimelineEventKind;
  title: string;
  detail: string;
  /** ISO 8601 date-time string. */
  time: string;
}

/**
 * Timestamp choice:
 * - A completed task uses its completedAt (when it was actually done).
 * - An open task, or one without completedAt, uses its dueAt.
 * - An appointment uses its startsAt.
 * Events with an unparseable timestamp are dropped so sorting stays well-defined.
 * The result is sorted newest first.
 */
export function buildTimeline(
  tasks: readonly Task[],
  appointments: readonly CareAppointment[],
): TimelineEvent[] {
  const events: TimelineEvent[] = [];

  for (const task of tasks) {
    const time = task.completed && task.completedAt ? task.completedAt : task.dueAt;
    if (Number.isNaN(Date.parse(time))) continue;
    const status = task.completed ? "Completed" : "Open";
    const detail = task.description ? `${status} · ${task.description}` : status;
    events.push({ id: `task-${task.id}`, kind: "task", title: task.title, detail, time });
  }

  for (const appointment of appointments) {
    if (Number.isNaN(Date.parse(appointment.startsAt))) continue;
    const parts = [appointment.location, appointment.note].filter((part) => part.trim() !== "");
    events.push({
      id: `appointment-${appointment.id}`,
      kind: "appointment",
      title: appointment.title,
      detail: parts.join(" · "),
      time: appointment.startsAt,
    });
  }

  return events.sort((a, b) => Date.parse(b.time) - Date.parse(a.time));
}
