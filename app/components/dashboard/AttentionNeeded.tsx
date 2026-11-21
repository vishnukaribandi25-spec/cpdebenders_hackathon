import Link from "next/link";
import { attentionItems } from "../../lib/mock-data";
import { IconAlertCircle, IconChevronRight } from "./Icons";

export default function AttentionNeeded() {
  return (
    <section aria-labelledby="attention-title" className="rounded-2xl border border-[#E3E8E6] bg-white p-5 sm:p-6">
      <div className="flex items-center gap-2">
        <IconAlertCircle className="h-5 w-5 text-[#B45309]" />
        <h2 id="attention-title" className="text-base font-bold text-[#1F2A28]">
          Attention Needed
        </h2>
      </div>

      <ul className="mt-4 divide-y divide-[#E3E8E6]">
        {attentionItems.map((item) => (
          <li key={item.id}>
            <Link
              href="/care-tasks"
              className="flex items-center justify-between gap-3 rounded-lg py-3 first:pt-0 last:pb-0 hover:text-[#2D7A6E] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2D7A6E]"
            >
              <span className="min-w-0">
                <span className="block text-sm font-semibold text-[#1F2A28]">{item.title}</span>
                <span className="mt-0.5 block text-xs text-[#6B7673]">{item.detail}</span>
              </span>
              <IconChevronRight className="h-4 w-4 shrink-0 text-[#4A5654]" />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
