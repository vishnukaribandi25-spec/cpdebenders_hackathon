// Appointment record persisted in localStorage. Separate from the static
// `Appointment` type in mock-data.ts, which has no id and only drives the
// dashboard placeholder card.

export interface CareAppointment {
  id: string;
  title: string;
  /** ISO 8601 date-time string. */
  startsAt: string;
  location: string;
  /** Member id from careCircleMembers, or "" when unassigned. */
  handledById: string;
  note: string;
}
