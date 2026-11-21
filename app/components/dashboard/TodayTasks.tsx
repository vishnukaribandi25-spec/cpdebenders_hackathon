"use client";

import Link from "next/link";
import { useState } from "react";
import type { Member } from "../../lib/mock-data";
import { isDueToday, isOverdue } from "../../lib/task-store";
import type { Priority, Task } from "../../lib/types";
import { useTasks } from "../../lib/use-tasks";
import Avatar from "./Avatar";
import { IconArrowRight, IconCheck, IconFilter } from "./Icons";
import TaskDialog from "./TaskDialog";

type TabId = "all" | "mine" | "completed";
type PriorityFilter = "all" | Priority;

const tabs: { id: TabId; label: string }[] = [
  { id: "all", label: "All tasks" },
  { id: "mine", label: "Assigned to me" },
  { id: "completed", label: "Completed" },
];

const priorityOptions: { id: PriorityFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "low", label: "Low" },
  { id: "medium", label: "Medium" },
  { id: "high", label: "High" },
];

const emptyMessage: Record<TabId, string> = {
  all: "No care tasks yet.",
  mine: "No tasks are assigned to you.",
  completed: "No tasks have been completed yet.",
};

const FOCUS_RING =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2D7A6E]";

const ICON_BUTTON = `flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[#4A5654] hover:bg-[#F4F6F5] ${FOCUS_RING}`;

const statusStyles = {
  todo: { label: "To do", className: "bg-[#EDF0EE] text-[#4A5654]" },
  completed: { label: "Completed", className: "bg-[#E3F1EC] text-[#1F6157]" },
  overdue: { label: "Overdue", className: "bg-[#FBE5E3] text-[#B42318]" },
} as const;

type StatusKey = keyof typeof statusStyles;

const priorityLabel: Record<Priority, string> = {
  low: "Low priority",
  medium: "Medium priority",
  high: "High priority",
};

const priorityTone: Record<Priority, string> = {
  low: "text-[#4A5654]",
  medium: "text-[#8A5A12]",
  high: "text-[#B42318]",
};

function taskStatus(task: Task, now: Date): StatusKey {
  if (task.completed) return "completed";
  if (isOverdue(task, now)) return "overdue";
  return "todo";
}

function StatusPill({ status }: { status: StatusKey }) {
  const style = statusStyles[status];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${style.className}`}>
      <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-current" />
      {style.label}
    </span>
  );
}

function IconPencil({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  );
}

function IconTrash({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M3 6h18" />
      <path d="M8 6V4h8v2" />
      <path d="M19 6l-1 14H6L5 6" />
    </svg>
  );
}

export default function TodayTasks({
  members,
  onAddTask,
}: {
  members: Member[];
  /** Opens the single add dialog owned by the dashboard page. */
  onAddTask: () => void;
}) {
  const { tasks, ready, editTask, removeTask, toggleTask } = useTasks();
  const [activeTab, setActiveTab] = useState<TabId>("all");
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>("all");
  const [filterOpen, setFilterOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const now = new Date();
  const memberById = new Map(members.map((member) => [member.id, member]));
  const me = members.find((member) => member.name === "Vishnu");

  const openCount = tasks.filter((task) => !task.completed).length;
  const dueToday = tasks.filter((task) => isDueToday(task, now));
  const doneToday = dueToday.filter((task) => task.completed).length;
  const percent = dueToday.length === 0 ? 0 : Math.round((doneToday / dueToday.length) * 100);

  const tabTasks = tasks.filter((task) => {
    if (activeTab === "mine") return me !== undefined && task.assigneeId === me.id;
    if (activeTab === "completed") return task.completed;
    return true;
  });
  const visibleTasks =
    priorityFilter === "all" ? tabTasks : tabTasks.filter((task) => task.priority === priorityFilter);

  const emptyText =
    tabTasks.length > 0 && visibleTasks.length === 0 ? "No tasks match this priority." : emptyMessage[activeTab];

  return (
    <section
      aria-labelledby="today-tasks-title"
      className="flex flex-col overflow-hidden rounded-2xl border border-[#E3E8E6] bg-white"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 pt-5 sm:px-6">
        <div className="flex items-center gap-3">
          <h2 id="today-tasks-title" className="text-lg font-bold text-[#1F2A28]">
            Today&apos;s Tasks
          </h2>
          <span className="rounded-md bg-[#E8ECEA] px-2 py-0.5 text-xs font-semibold text-[#4A5654]">
            {ready ? openCount : "…"}
          </span>
        </div>
        <Link
          href="/care-tasks"
          className={`inline-flex items-center gap-1.5 rounded text-sm font-semibold text-[#2D7A6E] hover:underline ${FOCUS_RING}`}
        >
          View all tasks
          <IconArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="mt-4 flex items-center justify-between border-b border-[#E3E8E6] px-5 sm:px-6">
        <div role="tablist" aria-label="Filter tasks by status" className="flex gap-5 overflow-x-auto">
          {tabs.map((tab) => {
            const selected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                id={`tab-${tab.id}`}
                type="button"
                role="tab"
                aria-selected={selected}
                aria-controls="tasks-panel"
                onClick={() => setActiveTab(tab.id)}
                className={`-mb-px whitespace-nowrap border-b-2 py-3 text-sm font-medium transition-colors ${FOCUS_RING} ${
                  selected
                    ? "border-[#2D7A6E] text-[#2D7A6E]"
                    : "border-transparent text-[#6B7673] hover:text-[#1F2A28]"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="relative my-2 shrink-0">
          <button
            type="button"
            aria-label="Filter tasks"
            aria-expanded={filterOpen}
            onClick={() => setFilterOpen((open) => !open)}
            className={`flex h-8 w-8 items-center justify-center rounded-lg hover:bg-[#F4F6F5] ${FOCUS_RING} ${
              priorityFilter !== "all" ? "bg-[#E3F1EC] text-[#2D7A6E]" : "text-[#4A5654]"
            }`}
          >
            <IconFilter className="h-4 w-4" />
          </button>
          {filterOpen && (
            <div
              role="group"
              aria-label="Filter by priority"
              className="absolute right-0 top-full z-10 mt-1 flex w-36 flex-col gap-1 rounded-xl border border-[#E3E8E6] bg-white p-2 shadow-lg"
            >
              <p className="px-2 pt-1 text-[11px] font-semibold uppercase tracking-wider text-[#6B7673]">Priority</p>
              {priorityOptions.map((option) => {
                const selected = priorityFilter === option.id;
                return (
                  <button
                    key={option.id}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => setPriorityFilter(option.id)}
                    className={`rounded-lg px-2 py-1.5 text-left text-sm ${
                      selected ? "bg-[#E3F1EC] font-semibold text-[#1F6157]" : "text-[#4A5654] hover:bg-[#F4F6F5]"
                    } ${FOCUS_RING}`}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div id="tasks-panel" role="tabpanel" aria-labelledby={`tab-${activeTab}`}>
        <div
          aria-hidden="true"
          className="hidden bg-[#F7F9F8] px-6 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-[#6B7673] md:grid md:grid-cols-[minmax(0,2.2fr)_minmax(0,1fr)_minmax(0,0.8fr)_minmax(0,1fr)_auto] md:gap-4"
        >
          <span>Task</span>
          <span>Assignee</span>
          <span>Due</span>
          <span>Status</span>
          <span>Actions</span>
        </div>

        {!ready ? (
          <p className="px-6 py-10 text-center text-sm text-[#6B7673]">Loading tasks…</p>
        ) : visibleTasks.length > 0 ? (
          <ul className="flex flex-col gap-3 p-4 md:gap-0 md:p-0">
            {visibleTasks.map((task) => {
              const status = taskStatus(task, now);
              const isDone = task.completed;
              const assignee = task.assigneeId ? memberById.get(task.assigneeId) : undefined;
              const dueLabel = new Date(task.dueAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
              const confirming = confirmDeleteId === task.id;
              return (
                <li
                  key={task.id}
                  className="grid grid-cols-2 gap-3 rounded-xl border border-[#E3E8E6] p-4 md:grid-cols-[minmax(0,2.2fr)_minmax(0,1fr)_minmax(0,0.8fr)_minmax(0,1fr)_auto] md:items-center md:gap-4 md:rounded-none md:border-0 md:border-t md:px-6 md:py-4"
                >
                  <label className="col-span-2 flex cursor-pointer items-start gap-3 md:col-span-1">
                    <input
                      type="checkbox"
                      checked={isDone}
                      onChange={() => toggleTask(task.id)}
                      className={`mt-0.5 h-5 w-5 shrink-0 cursor-pointer rounded accent-[#2D7A6E] ${FOCUS_RING}`}
                    />
                    <span className="min-w-0">
                      <span
                        className={`block text-sm font-semibold ${
                          isDone ? "text-[#6B7673] line-through decoration-[#6B7673]" : "text-[#1F2A28]"
                        }`}
                      >
                        {task.title}
                      </span>
                      {task.description && (
                        <span className="mt-0.5 block text-xs text-[#6B7673]">{task.description}</span>
                      )}
                    </span>
                  </label>

                  <div className="flex items-center gap-2 text-sm text-[#1F2A28]">
                    {assignee ? (
                      <>
                        <Avatar initials={assignee.initials} tone={assignee.tone} size="sm" />
                        <span>{assignee.name}</span>
                      </>
                    ) : (
                      <span className="text-[#6B7673]">Unassigned</span>
                    )}
                  </div>

                  <p className="text-sm text-[#4A5654]">
                    <span className="mr-2 text-xs font-semibold uppercase text-[#6B7673] md:hidden">Due</span>
                    {dueLabel}
                  </p>

                  <div className="flex flex-col items-start gap-1.5">
                    <StatusPill status={status} />
                    <span className={`text-xs font-medium ${priorityTone[task.priority]}`}>
                      {priorityLabel[task.priority]}
                    </span>
                  </div>

                  <div className="col-span-2 flex items-center justify-end gap-1 md:col-span-1">
                    {confirming ? (
                      <div className="flex items-center gap-2 text-sm text-[#1F2A28]">
                        <span>Delete?</span>
                        <button
                          type="button"
                          onClick={() => {
                            removeTask(task.id);
                            setConfirmDeleteId(null);
                          }}
                          className={`rounded-lg px-2 py-1 text-sm font-semibold text-[#B42318] hover:bg-[#FBE5E3] ${FOCUS_RING}`}
                        >
                          Yes
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(null)}
                          className={`rounded-lg px-2 py-1 text-sm font-semibold text-[#4A5654] hover:bg-[#F4F6F5] ${FOCUS_RING}`}
                        >
                          No
                        </button>
                      </div>
                    ) : (
                      <>
                        <button
                          type="button"
                          aria-label={`Edit task: ${task.title}`}
                          onClick={() => setEditingTask(task)}
                          className={ICON_BUTTON}
                        >
                          <IconPencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          aria-label={`Delete task: ${task.title}`}
                          onClick={() => setConfirmDeleteId(task.id)}
                          className={ICON_BUTTON}
                        >
                          <IconTrash className="h-4 w-4" />
                        </button>
                      </>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="flex flex-col items-center gap-3 px-6 py-10 text-center">
            <p className="text-sm text-[#6B7673]">{emptyText}</p>
            <button
              type="button"
              onClick={onAddTask}
              className={`rounded-xl bg-[#2D7A6E] px-4 py-2 text-sm font-semibold text-white hover:bg-[#25655B] ${FOCUS_RING}`}
            >
              Add care task
            </button>
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3 border-t border-[#E3E8E6] px-5 py-4 text-sm sm:px-6">
        <IconCheck className="h-4 w-4 text-[#2D7A6E]" />
        {ready && (
          <p className="text-[#4A5654]">
            {doneToday} of {dueToday.length} tasks completed today
          </p>
        )}
        <div
          role="progressbar"
          aria-label="Tasks completed today"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={percent}
          className="h-1.5 w-28 overflow-hidden rounded-full bg-[#E3E8E6]"
        >
          <div className="h-full rounded-full bg-[#2D7A6E] transition-all" style={{ width: `${percent}%` }} />
        </div>
      </div>

      <TaskDialog
        open={editingTask !== null}
        onClose={() => setEditingTask(null)}
        initialTask={editingTask ?? undefined}
        members={members}
        onSubmit={(input) => {
          if (editingTask) editTask(editingTask.id, input);
          setEditingTask(null);
        }}
      />
    </section>
  );
}
