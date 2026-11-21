import { IconRing } from "./Icons";

/** Shared empty state for sections that are not built yet. Server-renderable. */
export default function EmptyState({
  id,
  title,
  message,
}: {
  id: string;
  title: string;
  message: string;
}) {
  return (
    <section
      id={id}
      aria-labelledby={`${id}-title`}
      className="flex flex-col items-center gap-3 rounded-2xl border border-[#E3E8E6] bg-white px-6 py-16 text-center"
    >
      <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#E8F0ED] text-[#2D7A6E]">
        <IconRing className="h-6 w-6" />
      </span>
      <h2 id={`${id}-title`} className="text-base font-bold text-[#1F2A28]">
        {title}
      </h2>
      <p className="max-w-md text-sm text-[#6B7673]">{message}</p>
    </section>
  );
}
