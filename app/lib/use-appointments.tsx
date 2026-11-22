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
import type { CareAppointment } from "./appointment-types";
import {
  APPOINTMENTS_STORAGE_KEY,
  createAppointment,
  deleteAppointment,
  parseStoredAppointments,
  updateAppointment,
  type AppointmentInput,
  type AppointmentPatch,
} from "./appointment-store";

interface AppointmentsContextValue {
  appointments: CareAppointment[];
  /** False until localStorage has been read on the client. */
  ready: boolean;
  addAppointment: (input: AppointmentInput) => void;
  editAppointment: (id: string, patch: AppointmentPatch) => void;
  removeAppointment: (id: string) => void;
}

// Stable empty list used before hydration, so the server render and the first
// client render match.
const NO_APPOINTMENTS: CareAppointment[] = [];

// Raw localStorage value, exposed as an external store.
// undefined = not read yet (server render and first client render);
// string | null = the loaded value (null means nothing stored yet).
type RawSnapshot = string | null | undefined;

const storeListeners = new Set<() => void>();
let storeRaw: RawSnapshot = undefined;

function readStorage(): string | null {
  try {
    return window.localStorage.getItem(APPOINTMENTS_STORAGE_KEY);
  } catch {
    // Storage can be blocked (privacy mode, disabled cookies). Fall back to an empty list.
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
    window.localStorage.setItem(APPOINTMENTS_STORAGE_KEY, raw);
  } catch {
    // Quota exceeded or storage unavailable. The in-memory state still works.
  }
  storeListeners.forEach((listener) => listener());
}

function applyAppointments(update: (prev: CareAppointment[]) => CareAppointment[]): void {
  const prev = parseStoredAppointments(getRawSnapshot() ?? null);
  writeRaw(JSON.stringify(update(prev)));
}

const AppointmentsContext = createContext<AppointmentsContextValue | null>(null);

export function AppointmentsProvider({ children }: { children: ReactNode }) {
  // Reads localStorage after mount without calling setState inside an effect.
  // The server snapshot is undefined, so hydration matches the first client render.
  const raw = useSyncExternalStore(subscribeRaw, getRawSnapshot, getServerRawSnapshot);
  const ready = raw !== undefined;

  const appointments = useMemo<CareAppointment[]>(
    () => (raw === undefined ? NO_APPOINTMENTS : parseStoredAppointments(raw)),
    [raw],
  );

  // First visit: persist the empty list so the stored state exists across reloads.
  useEffect(() => {
    if (raw === null) writeRaw(JSON.stringify(appointments));
  }, [raw, appointments]);

  const addAppointment = useCallback((input: AppointmentInput) => {
    const appointment = createAppointment(input, new Date());
    applyAppointments((prev) => [...prev, appointment]);
  }, []);

  const editAppointment = useCallback((id: string, patch: AppointmentPatch) => {
    applyAppointments((prev) => updateAppointment(prev, id, patch));
  }, []);

  const removeAppointment = useCallback((id: string) => {
    applyAppointments((prev) => deleteAppointment(prev, id));
  }, []);

  const value = useMemo<AppointmentsContextValue>(
    () => ({ appointments, ready, addAppointment, editAppointment, removeAppointment }),
    [appointments, ready, addAppointment, editAppointment, removeAppointment],
  );

  return <AppointmentsContext.Provider value={value}>{children}</AppointmentsContext.Provider>;
}

export function useAppointments(): AppointmentsContextValue {
  const context = useContext(AppointmentsContext);
  if (context === null) {
    throw new Error("useAppointments must be used inside <AppointmentsProvider>.");
  }
  return context;
}
