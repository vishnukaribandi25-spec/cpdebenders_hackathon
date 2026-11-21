// Pure Care Tasks helpers. No React, and no window/localStorage access at
// import time, so this module is safe to import during prerender.

import type { Priority, Task, TaskStatus } from "./types";

export const STORAGE_KEY = "carecircle.tasks.v1";

const PRIORITIES: readonly Priority[] = ["low", "medium", "high"];
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export interface CreateTaskInput {
  title: string;
  description: string;
  assigneeId: string | null;
  /** Any string Date.parse accepts; stored as ISO. */
  dueAt: string;
  priority: Priority;
}

export type TaskPatch = Partial<Omit<Task, "id" | "createdAt">>;

function isPriority(value: unknown): value is Priority {
  return typeof value === "string" && (PRIORITIES as readonly string[]).includes(value);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isValidDateString(value: unknown): value is string {
  return typeof value === "string" && !Number.isNaN(Date.parse(value));
}

/** Local time of day on the same calendar date as `now`. */
function atLocalTime(now: Date, hours: number, minutes: number): string {
  const date = new Date(now.getTime());
  date.setHours(hours, minutes, 0, 0);
  return date.toISOString();
}

export function seedTasks(now: Date): Task[] {
  const createdAt = now.toISOString();
  return [
    {
      id: "task-1",
      title: "Doctor appointment",
      description: "Cardiology · bring previous reports",
      assigneeId: "ravi",
      dueAt: atLocalTime(now, 10, 0),
      priority: "high",
      completed: false,
      completedAt: null,
      createdAt,
    },
    {
      id: "task-2",
      title: "Pick up prescription",
      description: "Green Cross Pharmacy",
      assigneeId: "priya",
      dueAt: atLocalTime(now, 11, 30),
      priority: "medium",
      completed: false,
      completedAt: null,
      createdAt,
    },
    {
      id: "task-3",
      title: "Grocery delivery",
      description: "Fruits, vegetables & pantry essentials",
      assigneeId: "arjun",
      dueAt: atLocalTime(now, 17, 0),
      priority: "low",
      completed: false,
      completedAt: null,
      createdAt,
    },
    {
      id: "task-4",
      title: "Check blood pressure",
      description: "Reading recorded · 8:15 AM",
      assigneeId: "priya",
      dueAt: atLocalTime(now, 8, 0),
      priority: "medium",
      completed: true,
      completedAt: atLocalTime(now, 8, 15),
      createdAt,
    },
  ];
}

/** Fills optional fields with safe defaults. Returns null if id/title/completed are invalid. */
function normalizeTask(value: unknown, now: Date): Task | null {
  if (!isRecord(value)) return null;
  const { id, title, completed } = value;
  if (typeof id !== "string" || typeof title !== "string" || typeof completed !== "boolean") {
    return null;
  }

  const nowIso = now.toISOString();
  return {
    id,
    title,
    description: typeof value.description === "string" ? value.description : "",
    assigneeId: typeof value.assigneeId === "string" ? value.assigneeId : null,
    dueAt: isValidDateString(value.dueAt) ? value.dueAt : nowIso,
    priority: isPriority(value.priority) ? value.priority : "medium",
    completed,
    completedAt: isValidDateString(value.completedAt) ? value.completedAt : null,
    createdAt: isValidDateString(value.createdAt) ? value.createdAt : nowIso,
  };
}

/**
 * Parses stored tasks. Never throws.
 * - null, invalid JSON, or a non-array value: seed tasks.
 * - an empty array: an empty list (the user deleted everything).
 * - non-empty but no valid items: seed tasks.
 */
export function parseStoredTasks(raw: string | null, now: Date): Task[] {
  if (raw === null) return seedTasks(now);

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return seedTasks(now);
  }

  if (!Array.isArray(parsed)) return seedTasks(now);
  if (parsed.length === 0) return [];

  const tasks: Task[] = [];
  for (const item of parsed) {
    const task = normalizeTask(item, now);
    if (task !== null) tasks.push(task);
  }
  return tasks.length > 0 ? tasks : seedTasks(now);
}

/** Status is "completed" or "todo". Overdue is reported separately by isOverdue. */
export function deriveStatus(task: Task): TaskStatus {
  return task.completed ? "completed" : "todo";
}

export function isOverdue(task: Task, now: Date): boolean {
  return !task.completed && Date.parse(task.dueAt) < now.getTime();
}

export function isDueToday(task: Task, now: Date): boolean {
  const due = new Date(task.dueAt);
  if (Number.isNaN(due.getTime())) return false;
  return (
    due.getFullYear() === now.getFullYear() &&
    due.getMonth() === now.getMonth() &&
    due.getDate() === now.getDate()
  );
}

export function isCompletedThisWeek(task: Task, now: Date): boolean {
  if (!task.completed || task.completedAt === null) return false;
  const completedAt = Date.parse(task.completedAt);
  if (Number.isNaN(completedAt)) return false;
  const elapsed = now.getTime() - completedAt;
  return elapsed >= 0 && elapsed <= WEEK_MS;
}

export function createTask(input: CreateTaskInput, now: Date): Task {
  const suffix = Math.random().toString(36).slice(2, 8);
  return {
    id: `task-${now.getTime().toString(36)}-${suffix}`,
    title: input.title.trim(),
    description: input.description.trim(),
    assigneeId: input.assigneeId,
    dueAt: new Date(input.dueAt).toISOString(),
    priority: input.priority,
    completed: false,
    completedAt: null,
    createdAt: now.toISOString(),
  };
}

export function updateTask(tasks: Task[], id: string, patch: TaskPatch): Task[] {
  return tasks.map((task) => (task.id === id ? { ...task, ...patch } : task));
}

export function toggleComplete(tasks: Task[], id: string, now: Date): Task[] {
  return tasks.map((task) => {
    if (task.id !== id) return task;
    return task.completed
      ? { ...task, completed: false, completedAt: null }
      : { ...task, completed: true, completedAt: now.toISOString() };
  });
}

export function deleteTask(tasks: Task[], id: string): Task[] {
  return tasks.filter((task) => task.id !== id);
}

export function validateTaskInput(input: CreateTaskInput): Record<string, string> {
  const errors: Record<string, string> = {};

  const title = input.title.trim();
  if (title.length === 0) {
    errors.title = "Title is required.";
  } else if (title.length > 120) {
    errors.title = "Title must be 120 characters or fewer.";
  }

  if (!input.dueAt) {
    errors.dueAt = "Due date and time are required.";
  } else if (Number.isNaN(Date.parse(input.dueAt))) {
    errors.dueAt = "Due date and time must be a valid date.";
  }

  if (!isPriority(input.priority)) {
    errors.priority = "Priority must be low, medium, or high.";
  }

  return errors;
}
