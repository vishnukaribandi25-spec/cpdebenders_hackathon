"use client";


import { useState } from "react";
import { careRecipient, todayLabel } from "../../lib/mock-data";
import { IconBell, IconCalendar, IconChevronRight, IconSearch, IconUsers } from "./Icons";

const FOCUS_RING =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2D7A6E]";

export default function TopHeader({ current = "Overview" }: { current?: string }) {
  const [notice, setNotice] = useState("");

  return (
    <header className="sticky top-0 z-20 flex min-h-[76px] flex-wrap items-center justify-between gap-3 border-b border-[#E3E8E6] bg-white px-4 py-3 sm:px-8">
      <nav aria-label="Breadcrumb">
        <ol className="flex items-center gap-2 text-sm">
          <li className="flex items-center gap-2 font-medium text-[#1F2A28]">
            <IconUsers className="h-4 w-4 text-[#4A5654]" />
            <span>{careRecipient.name}&rsquo;s care circle</span>
          </li>
          <li aria-hidden="true" className="text-[#9AA5A1]">
            <IconChevronRight className="h-4 w-4" />
          </li>
          <li aria-current="page" className="text-[#6B7673]">
            {current}
          </li>
        </ol>
      </nav>

      <div className="flex items-center gap-2 sm:gap-4">
        <p role="status" className="max-w-[12rem] text-xs text-[#6B7673]">
          {notice}
        </p>
        <button
          type="button"
          aria-label="Search"
          onClick={() => setNotice("Search is not available yet.")}
          className={`flex h-10 w-10 items-center justify-center rounded-lg text-[#4A5654] hover:bg-[#F4F6F5] ${FOCUS_RING}`}
        >
          <IconSearch />
        </button>
        <button
          type="button"
          aria-label="Notifications"
          onClick={() => setNotice("No new notifications.")}
          className={`flex h-10 w-10 items-center justify-center rounded-lg text-[#4A5654] hover:bg-[#F4F6F5] ${FOCUS_RING}`}
        >
          <IconBell />
        </button>
        <span className="hidden items-center gap-2 border-l border-[#E3E8E6] pl-4 text-sm font-medium text-[#1F2A28] md:flex">
          <IconCalendar className="h-4 w-4 text-[#4A5654]" />
          <time>{todayLabel}</time>
        </span>
      </div>
    </header>
  );
}
