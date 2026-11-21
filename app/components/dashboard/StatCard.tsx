import type { StatCard as StatCardData } from "../../lib/mock-data";
import { IconAlertTriangle, IconCheck, IconClock, IconUsers } from "./Icons";

const iconBoxTone: Record<StatCardData["iconTone"], string> = {
  green: "bg-[#E3F1EC] text-[#2D7A6E]",
  amber: "bg-[#FBF0DA] text-[#A86A12]",
  red: "bg-[#FBE5E3] text-[#B42318]",
};

const noteTone: Record<StatCardData["noteTone"], string> = {
  teal: "text-[#2D7A6E]",
  amber: "text-[#A86A12]",
  red: "text-[#B42318]",
};

const iconMap = {
  clock: IconClock,
  people: IconUsers,
  alert: IconAlertTriangle,
  check: IconCheck,
};

export default function StatCard({ card }: { card: StatCardData }) {
  const Icon = iconMap[card.icon];
  const titleId = `stat-${card.id}`;
  return (
    <section
      aria-labelledby={titleId}
      className="flex flex-col rounded-2xl border border-[#E3E8E6] bg-white p-5"
    >
      <div className="flex items-start justify-between gap-3">
        <h2 id={titleId} className="text-sm font-medium text-[#4A5654]">
          {card.label}
        </h2>
        <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${iconBoxTone[card.iconTone]}`}>
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <div className="mt-4 flex flex-wrap items-baseline gap-x-2 gap-y-1">
        <p className="text-[28px] font-bold leading-none text-[#1F2A28]">{card.value}</p>
        <p className={`text-xs font-medium ${noteTone[card.noteTone]}`}>{card.note}</p>
      </div>
    </section>
  );
}
