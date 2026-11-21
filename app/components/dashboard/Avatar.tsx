import type { AvatarTone } from "../../lib/mock-data";

const toneClasses: Record<AvatarTone, string> = {
  teal: "bg-[#D6EAE4] text-[#1F6157]",
  sky: "bg-[#DCE8F5] text-[#2F5D8C]",
  rose: "bg-[#F6DCE0] text-[#9A3D4F]",
  amber: "bg-[#F7E7C8] text-[#7A4F0E]",
  violet: "bg-[#E6E0F5] text-[#5B4A94]",
  slate: "bg-[#E3E8E6] text-[#3D4A47]",
};

const sizeClasses = {
  sm: "h-6 w-6 text-[10px]",
  md: "h-8 w-8 text-xs",
  lg: "h-14 w-14 text-lg",
};

type AvatarProps = {
  initials: string;
  tone?: AvatarTone;
  size?: keyof typeof sizeClasses;
  /** Provide a label when the avatar is meaningful on its own; otherwise it is decorative. */
  label?: string;
  className?: string;
};

export default function Avatar({
  initials,
  tone = "teal",
  size = "md",
  label,
  className = "",
}: AvatarProps) {
  const a11y = label ? { role: "img" as const, "aria-label": label } : { "aria-hidden": true };
  return (
    <span
      {...a11y}
      className={`inline-flex shrink-0 items-center justify-center rounded-full font-semibold select-none ${sizeClasses[size]} ${toneClasses[tone]} ${className}`}
    >
      {initials}
    </span>
  );
}
