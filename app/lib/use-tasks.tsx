"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import {
  STORAGE_KEY,
  createTask,
  deleteTask,
  parseStoredTasks,
  toggleComplete,
  updateTask,
  type CreateTaskInput,
  type TaskPatch,
} from "./task-store";
import type { Task } from "./types";

interface TasksContextValue {
  tasks: Task[];
  /** False until localStorage has been read on the client. */
  ready: boolean;
  addTask: (input: CreateTaskInput) => void;
  editTask: (id: string, patch: TaskPatch) => void;
  removeTask: (id: string) => void;
  toggleTask: (id: string) => void;
}

// Stable empty list used before hydration, so the server render and the first
// client render match. Seed data needs `now`, so it is not built here.
const NO_TASKS: Task[] = [];

// Raw localStorage value, exposed as an external store.
// undefined = not read yet (server render and first client render);
// string | null = the loaded value (null means nothing stored yet).
type RawSnapshot = string | null | undefined;

const storeListeners = new Set<() => void>();
let storeRaw: RawSnapshot = undefined;

function readStorage(): string | null {
  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch {
    // Storage can be blocked (privacy mode, disabled cookies). Fall back to seed data.
    return null;
  }
}

function getRawSnapshot(): RawSnapshot {
  if (storeRaw === undefined) storeRaw = readStorage();
  return storeRaw;
}

function getServerRawSnapshot(): RawSnapshot {
  return undefined;
}

function subscribeRaw(listener: () => void): () => void {
  storeListeners.add(listener);
  return () => {
    storeListeners.delete(listener);
  };
}

function writeRaw(raw: string): void {
  // Keep the in-memory value even if storage is unavailable, so the app still works.
  storeRaw = raw;
  try {
    window.localStorage.setItem(STORAGE_KEY, raw);
  } catch {
    // Quota exceeded or storage unavailable. The in-memory state still works.
  }
  storeListeners.forEach((listener) => listener());
}

function applyTasks(update: (prev: Task[]) => Task[]): void {
  const prev = parseStoredTasks(getRawSnapshot() ?? null, new Date());
  writeRaw(JSON.stringify(update(prev)));
}

const TasksContext = createContext<TasksContextValue | null>(null);

export function TasksProvider({ children }: { children: ReactNode }) {
  // Reads localStorage after mount without calling setState inside an effect.
  // The server snapshot is undefined, so hydration matches the first client render.
  const raw = useSyncExternalStore(subscribeRaw, getRawSnapshot, getServerRawSnapshot);
  const ready = raw !== undefined;

  const tasks = useMemo<Task[]>(
    () => (raw === undefined ? NO_TASKS : parseStoredTasks(raw, new Date())),
    [raw],
  );

  // First visit: persist the seed data so it stays stable across reloads.
  useEffect(() => {
    if (raw === null) writeRaw(JSON.stringify(tasks));
  }, [raw, tasks]);

  const addTask = useCallback((input: CreateTaskInput) => {
    const task = createTask(input, new Date());
    applyTasks((prev) => [...prev, task]);
  }, []);

  const editTask = useCallback((id: string, patch: TaskPatch) => {
    applyTasks((prev) => updateTask(prev, id, patch));
  }, []);

  const removeTask = useCallback((id: string) => {
    applyTasks((prev) => deleteTask(prev, id));
  }, []);

  const toggleTask = useCallback((id: string) => {
    const now = new Date();
    applyTasks((prev) => toggleComplete(prev, id, now));
  }, []);

  const value = useMemo<TasksContextValue>(
    () => ({ tasks, ready, addTask, editTask, removeTask, toggleTask }),
    [tasks, ready, addTask, editTask, removeTask, toggleTask],
  );

  return <TasksContext.Provider value={value}>{children}</TasksContext.Provider>;
}

export function useTasks(): TasksContextValue {
  const context = useContext(TasksContext);
  if (context === null) {
    throw new Error("useTasks must be used inside <TasksProvider>.");
  }
  return context;
}
