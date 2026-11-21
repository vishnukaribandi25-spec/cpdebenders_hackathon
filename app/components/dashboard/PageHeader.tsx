"use client";

import { useState } from "react";
import { pageHeading } from "../../lib/mock-data";
import { IconPlus, IconSparkle } from "./Icons";

const FOCUS_RING =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2D7A6E]";

export default function PageHeader({
  onAddTask,
  title = pageHeading.title,
  subtitle = pageHeading.subtitle,
  showActions = true,
}: {
  onAddTask?: () => void;
  title?: string;
  subtitle?: string;
  /** Hide the AI Assistant and Add Care Task buttons on pages that do not use them. */
  showActions?: boolean;
}) {
  const [notice, setNotice] = useState("");

  return (
    <section aria-labelledby="page-title" className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h1 id="page-title" className="text-3xl font-bold tracking-tight text-[#1F2A28] sm:text-[32px]">
          {title}
        </h1>
        <p className="mt-1 text-sm text-[#6B7673]">{subtitle}</p>
      </div>

      {showActions ? (
      <div className="flex flex-col items-stretch gap-2 sm:items-end">
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => setNotice("The AI Assistant is not available yet.")}
            className={`inline-flex items-center gap-2 rounded-xl border border-[#D5DEDA] bg-white px-4 py-2.5 text-sm font-semibold text-[#1F2A28] hover:bg-[#F4F6F5] ${FOCUS_RING}`}
          >
            <IconSparkle className="h-4 w-4 text-[#2D7A6E]" />
            AI Assistant
          </button>
          <button
            type="button"
            onClick={() => onAddTask?.()}
            className={`inline-flex items-center gap-2 rounded-xl bg-[#2D7A6E] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#25655B] ${FOCUS_RING}`}
          >
            <IconPlus className="h-4 w-4" />
            Add Care Task
          </button>
        </div>
        <p role="status" className="min-h-5 text-xs text-[#6B7673] sm:text-right">
          {notice}
        </p>
      </div>
      ) : null}
    </section>
  );
}
