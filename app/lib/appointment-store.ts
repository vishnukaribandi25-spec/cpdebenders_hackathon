// Pure Appointments helpers. No React, and no window/localStorage access at
// import time, so this module is safe to import during prerender.

import type { CareAppointment } from "./appointment-types";

export const APPOINTMENTS_STORAGE_KEY = "carecircle.appointments.v1";

export interface AppointmentInput {
  title: string;
  /** Any string Date.parse accepts; stored as ISO. */
  startsAt: string;
  location: string;
  handledById: string;
  note: string;
}

export type AppointmentPatch = Partial<Omit<CareAppointment, "id">>;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isValidDateString(value: unknown): value is string {
  return typeof value === "string" && !Number.isNaN(Date.parse(value));
}

/** Fills optional fields with safe defaults. Returns null if id/title/startsAt are invalid. */
function normalizeAppointment(value: unknown): CareAppointment | null {
  if (!isRecord(value)) return null;
  const { id, title, startsAt } = value;
  if (typeof id !== "string" || typeof title !== "string" || !isValidDateString(startsAt)) {
    return null;
  }

  return {
    id,
    title,
    startsAt: new Date(startsAt).toISOString(),
    location: typeof value.location === "string" ? value.location : "",
    handledById: typeof value.handledById === "string" ? value.handledById : "",
    note: typeof value.note === "string" ? value.note : "",
  };
}

/**
 * Parses stored appointments. Never throws. There is no seed data, so the
 * fallback for missing or unreadable storage is an empty list.
 */
export function parseStoredAppointments(raw: string | null): CareAppointment[] {
  if (raw === null) return [];

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return [];
  }

  if (!Array.isArray(parsed)) return [];

  const appointments: CareAppointment[] = [];
  for (const item of parsed) {
    const appointment = normalizeAppointment(item);
    if (appointment !== null) appointments.push(appointment);
  }
  return appointments;
}

export function createAppointment(input: AppointmentInput, now: Date): CareAppointment {
  const suffix = Math.random().toString(36).slice(2, 8);
  return {
    id: `appt-${now.getTime().toString(36)}-${suffix}`,
    title: input.title.trim(),
    startsAt: new Date(input.startsAt).toISOString(),
    location: input.location.trim(),
    handledById: input.handledById,
    note: input.note.trim(),
  };
}

export function updateAppointment(
  appointments: CareAppointment[],
  id: string,
  patch: AppointmentPatch,
): CareAppointment[] {
  return appointments.map((appointment) =>
    appointment.id === id ? { ...appointment, ...patch } : appointment,
  );
}

export function deleteAppointment(appointments: CareAppointment[], id: string): CareAppointment[] {
  return appointments.filter((appointment) => appointment.id !== id);
}

/** Upcoming appointments first (soonest first), then past ones (most recent first). */
export function sortAppointments(appointments: CareAppointment[], now: Date): CareAppointment[] {
  const nowMs = now.getTime();
  const time = (appointment: CareAppointment) => Date.parse(appointment.startsAt);

  const upcoming = appointments.filter((a) => time(a) >= nowMs).sort((a, b) => time(a) - time(b));
  const past = appointments.filter((a) => time(a) < nowMs).sort((a, b) => time(b) - time(a));
  return [...upcoming, ...past];
}

/** The soonest appointment that has not started yet, or undefined. */
export function nextUpcomingAppointment(
  appointments: CareAppointment[],
  now: Date,
): CareAppointment | undefined {
  const nowMs = now.getTime();
  let next: CareAppointment | undefined;
  for (const appointment of appointments) {
    const time = Date.parse(appointment.startsAt);
    if (time < nowMs) continue;
    if (next === undefined || time < Date.parse(next.startsAt)) next = appointment;
  }
  return next;
}

export function validateAppointmentInput(input: AppointmentInput): Record<string, string> {
  const errors: Record<string, string> = {};

  const title = input.title.trim();
  if (title.length === 0) {
    errors.title = "Title is required.";
  } else if (title.length > 120) {
    errors.title = "Title must be 120 characters or fewer.";
  }

  if (!input.startsAt) {
    errors.startsAt = "Date and time are required.";
  } else if (Number.isNaN(Date.parse(input.startsAt))) {
    errors.startsAt = "Date and time must be a valid date.";
  }

  return errors;
}
