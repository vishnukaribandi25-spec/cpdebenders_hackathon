"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { AppointmentsProvider } from "../../lib/use-appointments";
import { CareCircleProvider } from "../../lib/use-care-circle";
import { TasksProvider } from "../../lib/use-tasks";
import Sidebar from "./Sidebar";
import TopHeader from "./TopHeader";

const PAGE_LABELS: Record<string, string> = {
  "/": "Overview",
  "/care-tasks": "Care Tasks",
  "/timeline": "Timeline",
  "/care-circle": "Care Circle",
  "/appointments": "Appointments",
  "/settings": "Settings",
};

/**
 * Shared dashboard frame: sidebar, top header and the page content area.
 * Mounted once by the (app) route group layout, so it persists across client-side navigation.
 * The breadcrumb label is derived from the current path unless `current` is passed explicitly.
 */
export default function AppShell({ children, current }: { children: ReactNode; current?: string }) {
  const pathname = usePathname();
  const label = current ?? PAGE_LABELS[pathname] ?? "Overview";

  return (
    <TasksProvider>
      <AppointmentsProvider>
        <CareCircleProvider>
          <div className="flex min-h-screen w-full flex-1 flex-col bg-[#F4F6F5] text-[#1F2A28]">
            <Sidebar />

            <div className="flex flex-1 flex-col lg:pl-[232px]">
              <TopHeader current={label} />
              {children}
            </div>
          </div>
        </CareCircleProvider>
      </AppointmentsProvider>
    </TasksProvider>
  );
}
