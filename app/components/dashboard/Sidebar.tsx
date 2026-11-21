"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  currentUser,
  navItems,
  type NavIcon,
  type NavItem,
} from "../../lib/mock-data";
import Avatar from "./Avatar";
import {
  IconCalendar,
  IconChevronRight,
  IconClipboardCheck,
  IconClose,
  IconDashboard,
  IconMenu,
  IconRing,
  IconSettings,
  IconTimeline,
  IconUsers,
} from "./Icons";

const FOCUS_RING =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2D7A6E]";

const navIconMap: Record<NavIcon, typeof IconDashboard> = {
  dashboard: IconDashboard,
  tasks: IconClipboardCheck,
  appointments: IconCalendar,
  timeline: IconTimeline,
  circle: IconUsers,
  settings: IconSettings,
};

function BrandMark() {
  return (
    <div className="flex items-center gap-3">
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#2D7A6E] text-white">
        <IconRing className="h-6 w-6" />
      </span>
      <span className="text-lg font-bold tracking-tight text-[#1F2A28]">CareCircle</span>
    </div>
  );
}

function isActivePath(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavLink({
  item,
  active,
  onNavigate,
}: {
  item: NavItem;
  active: boolean;
  onNavigate: () => void;
}) {
  const Icon = navIconMap[item.icon];
  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${FOCUS_RING} ${
        active
          ? "bg-[#E3EFEB] text-[#2D7A6E]"
          : "text-[#4A5654] hover:bg-[#F4F6F5] hover:text-[#1F2A28]"
      }`}
    >
      <Icon className="h-5 w-5 shrink-0" />
      <span>{item.label}</span>
      {item.badge ? (
        <span className="ml-auto rounded-md bg-[#E8ECEA] px-2 py-0.5 text-xs font-semibold text-[#4A5654]">
          {item.badge}
        </span>
      ) : null}
    </Link>
  );
}

export default function Sidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const close = () => setOpen(false);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return (
    <>
      {/* Mobile / tablet top bar with hamburger */}
      <div className="flex h-16 items-center justify-between border-b border-[#E3E8E6] bg-white px-4 lg:hidden">
        <BrandMark />
        <button
          type="button"
          aria-label="Open navigation menu"
          aria-controls="app-sidebar"
          aria-expanded={open}
          onClick={() => setOpen(true)}
          className={`flex h-10 w-10 items-center justify-center rounded-lg text-[#1F2A28] hover:bg-[#F4F6F5] ${FOCUS_RING}`}
        >
          <IconMenu />
        </button>
      </div>

      {/* Backdrop for the drawer (below lg only) */}
      {open ? (
        <button
          type="button"
          aria-label="Close navigation menu"
          aria-hidden="true"
          tabIndex={-1}
          onClick={close}
          className="fixed inset-0 z-40 bg-[#1F2A28]/40 lg:hidden"
        />
      ) : null}

      <aside
        id="app-sidebar"
        aria-label="Sidebar"
        className={`fixed inset-y-0 left-0 z-50 flex w-[232px] flex-col overflow-y-auto border-r border-[#E3E8E6] bg-white px-4 py-6 transition-transform duration-200 lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between px-2">
          <BrandMark />
          <button
            type="button"
            aria-label="Close navigation menu"
            onClick={close}
            className={`flex h-9 w-9 items-center justify-center rounded-lg text-[#4A5654] hover:bg-[#F4F6F5] lg:hidden ${FOCUS_RING}`}
          >
            <IconClose />
          </button>
        </div>

        <nav aria-label="Main" className="mt-8 flex flex-col gap-1">
          {navItems.map((item) => (
            <NavLink
              key={item.label}
              item={item}
              active={isActivePath(pathname, item.href)}
              onNavigate={close}
            />
          ))}
        </nav>

        <div className="mt-auto flex flex-col gap-4 pt-8">
          <section
            aria-labelledby="invite-title"
            className="rounded-2xl bg-[#EEF5F2] p-4"
          >
            <IconUsers className="h-5 w-5 text-[#2D7A6E]" />
            <h2 id="invite-title" className="mt-3 text-sm font-bold text-[#1F2A28]">
              Care is better, together.
            </h2>
            <p className="mt-1 text-xs leading-5 text-[#6B7673]">
              Invite family. Share the load. Be there for what matters.
            </p>
            <Link
              href="/care-circle#invite"
              onClick={close}
              className={`mt-3 inline-flex items-center gap-1 rounded text-sm font-semibold text-[#2D7A6E] hover:underline ${FOCUS_RING}`}
            >
              Invite a family member
              <IconChevronRight className="h-4 w-4" />
            </Link>
          </section>

          <div className="border-t border-[#E3E8E6] pt-4">
            <div className="flex items-center gap-3 px-1">
              <Avatar initials={currentUser.initials} tone={currentUser.tone} size="lg" className="h-10 w-10" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-[#1F2A28]">{currentUser.name}</p>
                <p className="truncate text-xs text-[#6B7673]">{currentUser.role}</p>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
