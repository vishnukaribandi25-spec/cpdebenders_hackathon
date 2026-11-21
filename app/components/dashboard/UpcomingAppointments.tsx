import Link from "next/link";
import { upcomingAppointment } from "../../lib/mock-data";
import Avatar from "./Avatar";
import { IconArrowRight, IconCalendar, IconPin } from "./Icons";

export default function UpcomingAppointments() {
  const appt = upcomingAppointment;
  return (
    <section aria-labelledby="upcoming-title" className="rounded-2xl border border-[#E3E8E6] bg-white p-5 sm:p-6">
      <div className="flex items-center justify-between">
        <h2 id="upcoming-title" className="text-base font-bold text-[#1F2A28]">
          Upcoming Appointments
        </h2>
        <IconCalendar className="h-5 w-5 text-[#4A5654]" />
      </div>

      <div className="mt-5 flex gap-4">
        <div className="flex h-16 w-14 shrink-0 flex-col items-center justify-center rounded-xl bg-[#E8F0ED]">
          <span className="text-[10px] font-semibold tracking-wide text-[#4A5654]">{appt.dayLabel}</span>
          <span className="text-2xl font-bold leading-none text-[#2D7A6E]">{appt.dayNumber}</span>
        </div>
        <div className="min-w-0">
          <p className="text-sm font-bold text-[#1F2A28]">{appt.title}</p>
          <p className="mt-0.5 text-sm text-[#6B7673]">{appt.timeRange}</p>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-[#4A5654]">
            <IconPin className="h-3.5 w-3.5 shrink-0 text-[#6B7673]" />
            {appt.location}
          </p>
        </div>
      </div>

      <Link
        href="/appointments"
        className="mt-5 flex items-center justify-between gap-3 rounded-lg text-sm text-[#1F2A28] hover:text-[#2D7A6E] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2D7A6E]"
      >
        <span className="flex items-center gap-2">
          <Avatar initials={appt.handledBy.initials} tone={appt.handledBy.tone} size="sm" />
          {appt.handledNote}
        </span>
        <IconArrowRight className="h-4 w-4 text-[#2D7A6E]" />
      </Link>

      <div className="mt-5 border-t border-[#E3E8E6] pt-4">
        <Link
          href="/appointments"
          className="inline-flex items-center gap-1.5 rounded text-sm font-semibold text-[#2D7A6E] hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2D7A6E]"
        >
          View calendar
          <IconArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </section>
  );
}
