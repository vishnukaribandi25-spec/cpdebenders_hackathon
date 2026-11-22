"use client";

import { useCallback, useState } from "react";
import type { CareAppointment } from "../../lib/appointment-types";
import { sortAppointments, type AppointmentInput } from "../../lib/appointment-store";
import { careCircleMembers, type Member } from "../../lib/mock-data";
import { useAppointments } from "../../lib/use-appointments";
import Avatar from "../dashboard/Avatar";
import EmptyState from "../dashboard/EmptyState";
import AppointmentDialog from "./AppointmentDialog";

const FOCUS_RING =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2D7A6E]";

const UNASSIGNED: Member = { id: "", name: "Unassigned", initials: "?", tone: "slate", role: "" };

function memberFor(id: string): Member {
  return careCircleMembers.find((member) => member.id === id) ?? UNASSIGNED;
}

export default function AppointmentsClient() {
  const { appointments, addAppointment, editAppointment, removeAppointment } = useAppointments();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<CareAppointment | null>(null);

  // Sorted in render; the upcoming/past split is re-evaluated on each render.
  const now = new Date();
  const sorted = sortAppointments(appointments, now);

  const closeDialog = useCallback(() => {
    setDialogOpen(false);
    setEditing(null);
  }, []);

  function openAdd() {
    setEditing(null);
    setDialogOpen(true);
  }

  function openEdit(appointment: CareAppointment) {
    setEditing(appointment);
    setDialogOpen(true);
  }

  function handleSubmit(input: AppointmentInput) {
    if (editing) {
      editAppointment(editing.id, input);
    } else {
      addAppointment(input);
    }
    closeDialog();
  }

  return (
    <>
      <div className="flex justify-end">
        <button
          type="button"
          onClick={openAdd}
          className={`rounded-xl bg-[#2D7A6E] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#25655B] ${FOCUS_RING}`}
        >
          Add appointment
        </button>
      </div>

      {sorted.length === 0 ? (
        <EmptyState
          id="appointments-empty"
          title="No appointments yet"
          message="Add an appointment for Lakshmi and it will show up here and on the dashboard."
        />
      ) : (
        <ul className="flex flex-col gap-4">
          {sorted.map((appointment) => {
            const when = new Date(appointment.startsAt);
            const handler = memberFor(appointment.handledById);
            const isPast = when.getTime() < now.getTime();
            return (
              <li
                key={appointment.id}
                className="flex flex-col gap-4 rounded-2xl border border-[#E3E8E6] bg-white p-5 sm:flex-row sm:items-start sm:p-6"
              >
                <div className="flex h-16 w-14 shrink-0 flex-col items-center justify-center rounded-xl bg-[#E8F0ED]">
                  <span className="text-[10px] font-semibold tracking-wide text-[#4A5654]">
                    {when.toLocaleDateString(undefined, { weekday: "short" }).toUpperCase()}
                  </span>
                  <span className="text-2xl font-bold leading-none text-[#2D7A6E]">{when.getDate()}</span>
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-[#1F2A28]">
                    {appointment.title}
                    {isPast && <span className="ml-2 text-xs font-normal text-[#6B7673]">Past</span>}
                  </p>
                  <p className="mt-0.5 text-sm text-[#6B7673]">
                    {when.toLocaleString(undefined, {
                      weekday: "long",
                      day: "numeric",
                      month: "short",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </p>
                  {appointment.location && <p className="mt-1 text-sm text-[#4A5654]">{appointment.location}</p>}
                  <p className="mt-2 flex items-center gap-2 text-sm text-[#4A5654]">
                    <Avatar initials={handler.initials} tone={handler.tone} size="sm" />
                    {handler.id === "" ? "Unassigned" : `${handler.name} is handling this`}
                  </p>
                  {appointment.note && <p className="mt-2 text-sm text-[#6B7673]">{appointment.note}</p>}
                </div>

                <div className="flex gap-2 sm:shrink-0">
                  <button
                    type="button"
                    onClick={() => openEdit(appointment)}
                    className={`rounded-xl border border-[#D5DEDA] bg-white px-3 py-2 text-sm font-semibold text-[#1F2A28] hover:bg-[#F4F6F5] ${FOCUS_RING}`}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => removeAppointment(appointment.id)}
                    className={`rounded-xl border border-[#E8C4C0] bg-white px-3 py-2 text-sm font-semibold text-[#B42318] hover:bg-[#FBEFEE] ${FOCUS_RING}`}
                  >
                    Delete
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <AppointmentDialog
        open={dialogOpen}
        onClose={closeDialog}
        initialAppointment={editing ?? undefined}
        onSubmit={handleSubmit}
      />
    </>
  );
}
