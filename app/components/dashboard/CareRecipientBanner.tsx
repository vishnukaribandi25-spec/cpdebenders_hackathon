import Link from "next/link";
import { careCircleMembers, careRecipient } from "../../lib/mock-data";
import Avatar from "./Avatar";
import { IconChevronRight } from "./Icons";

export default function CareRecipientBanner() {
  return (
    <Link
      href="/care-circle"
      className="group flex flex-col gap-4 rounded-2xl bg-[#E8F0ED] p-5 transition-colors hover:bg-[#DFEAE5] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2D7A6E] sm:flex-row sm:items-center sm:justify-between sm:p-6"
    >
      <div className="flex items-center gap-4">
        <Avatar initials={careRecipient.initials} tone={careRecipient.tone} size="lg" />
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-bold text-[#1F2A28]">Caring for {careRecipient.name}</h2>
            <span className="rounded-full bg-[#CFE5DE] px-2 py-0.5 text-[11px] font-semibold tracking-wide text-[#1F6157]">
              {careRecipient.relationTag}
            </span>
          </div>
          <p className="mt-0.5 text-sm text-[#6B7673]">{careRecipient.tagline}</p>
        </div>
      </div>

      <div className="flex items-center gap-4 sm:pl-6">
        <div className="flex -space-x-2" aria-hidden="true">
          {careCircleMembers.map((member) => (
            <Avatar
              key={member.id}
              initials={member.initials}
              tone={member.tone}
              size="md"
              className="ring-2 ring-[#E8F0ED]"
            />
          ))}
        </div>
        <div>
          <p className="text-sm font-bold text-[#1F2A28]">{careRecipient.circleHeadline}</p>
          <p className="text-xs text-[#6B7673]">{careRecipient.circleNames}</p>
        </div>
        <IconChevronRight className="h-5 w-5 shrink-0 text-[#4A5654] transition-transform group-hover:translate-x-0.5" />
      </div>
    </Link>
  );
}
