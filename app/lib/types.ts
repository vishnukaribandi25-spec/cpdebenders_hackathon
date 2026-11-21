// Care Tasks domain types.
// Field names follow the Care Tasks spec. They are separate from the display
// types in mock-data.ts (which use `detail`, `assignee: Member`, `due: string`).

export type Priority = "low" | "medium" | "high";

export type TaskStatus = "todo" | "in_progress" | "awaiting" | "completed";

export interface Member {
  id: string;
  name: string;
  initials: string;
  role: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  assigneeId: string | null;
  /** ISO 8601 datetime string. */
  dueAt: string;
  priority: Priority;
  completed: boolean;
  /** ISO 8601 datetime string, set while completed. */
  completedAt: string | null;
  /** ISO 8601 datetime string. */
  createdAt: string;
}
