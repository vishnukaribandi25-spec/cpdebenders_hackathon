import Link from "next/link";
import { activityItems } from "../../lib/mock-data";
import Avatar from "./Avatar";
import { IconArrowRight } from "./Icons";

export default function RecentActivity() {
  return (
    <section aria-labelledby="activity-title" className="rounded-2xl border border-[#E3E8E6] bg-white p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <h2 id="activity-title" className="text-base font-bold text-[#1F2A28]">
            Recent Family Activity
          </h2>
          <p className="text-sm text-[#6B7673]">A shared picture of care</p>
        </div>
        <Link
          href="/timeline"
          className="inline-flex items-center gap-1.5 rounded text-sm font-semibold text-[#2D7A6E] hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2D7A6E]"
        >
          View timeline
          <IconArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <ul className="mt-4 divide-y divide-[#E3E8E6]">
        {activityItems.map((item) => (
          <li
            key={item.id}
            className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0 md:flex-row md:items-center md:justify-between md:gap-6"
          >
            <div className="flex min-w-0 items-start gap-3">
              <Avatar initials={item.actor.initials} tone={item.actor.tone} size="md" />
              <div className="min-w-0">
                <p className="text-sm text-[#1F2A28]">
                  <span className="font-semibold">{item.actor.name}</span> {item.action}
                </p>
                <p className="mt-0.5 text-sm text-[#6B7673]">{item.detail}</p>
              </div>
            </div>
            <div className="flex shrink-0 items-center justify-between gap-6 pl-11 text-sm md:justify-end md:pl-0">
              <span className="font-medium text-[#2D7A6E] md:w-28 md:text-right">{item.label}</span>
              <time className="text-[#6B7673] md:w-36 md:text-right">{item.time}</time>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
