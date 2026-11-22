"use client";

import EmptyState from "../dashboard/EmptyState";
import { useAppointments } from "../../lib/use-appointments";
import { useTasks } from "../../lib/use-tasks";
import { buildTimeline, type TimelineEvent } from "../../lib/timeline";

function formatTime(iso: string): string {
  return new Date(iso).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" });
}

function EventCard({ event }: { event: TimelineEvent }) {
  const label = event.kind === "task" ? "Task" : "Appointment";
  return (
    <li className="rounded-2xl border border-[#E3E8E6] bg-white p-5">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-[#CFE5DE] px-2.5 py-0.5 text-[11px] font-semibold text-[#1F6157]">
          {label}
        </span>
        <time dateTime={event.time} className="text-xs text-[#6B7673]">
          {formatTime(event.time)}
        </time>
      </div>
      <h3 className="mt-2 font-bold text-[#1F2A28]">{event.title}</h3>
      {event.detail && <p className="mt-1 text-sm text-[#6B7673]">{event.detail}</p>}
    </li>
  );
}

export default function TimelineClient() {
  const { tasks } = useTasks();
  const { appointments } = useAppointments();
  const events = buildTimeline(tasks, appointments);

  if (events.length === 0) {
    return (
      <EmptyState
        id="timeline-empty"
        title="Nothing on the timeline yet"
        message="Activity will appear here as your family coordinates care."
      />
    );
  }

  return (
    <ol className="flex flex-col gap-4" aria-label="Care activity, newest first">
      {events.map((event) => (
        <EventCard key={event.id} event={event} />
      ))}
    </ol>
  );
}
