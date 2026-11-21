"use client";

import { useState } from "react";
import { careCircleMembers, currentUser, statCards, type StatCard as StatCardData } from "../../lib/mock-data";
import { isCompletedThisWeek, isDueToday, isOverdue } from "../../lib/task-store";
import { useTasks } from "../../lib/use-tasks";
import AttentionNeeded from "./AttentionNeeded";
import CareRecipientBanner from "./CareRecipientBanner";
import PageHeader from "./PageHeader";
import RecentActivity from "./RecentActivity";
import StatCard from "./StatCard";
import TaskDialog from "./TaskDialog";
import TodayTasks from "./TodayTasks";
import UpcomingAppointments from "./UpcomingAppointments";

// Members who can be assigned tasks. Vishnu is included so "Assigned to me" works.
const members = [currentUser, ...careCircleMembers];

/**
 * Dashboard body. Owns the single "Add care task" dialog, opened from the page
 * header and from the empty state in TodayTasks. TodayTasks owns its own edit dialog.
 */
export default function DashboardClient() {
  const { tasks, ready, addTask } = useTasks();
  const [addOpen, setAddOpen] = useState(false);

  const now = new Date();
  const dueToday = tasks.filter((task) => isDueToday(task, now));
  const dueTodayOpen = dueToday.filter((task) => !task.completed).length;
  const overdueCount = tasks.filter((task) => isOverdue(task, now)).length;
  const completedWeekCount = tasks.filter((task) => isCompletedThisWeek(task, now)).length;
  // Task has no acceptance flag yet, so nothing can be awaiting acceptance.
  const awaitingCount = 0;

  const show = (n: number) => (ready ? String(n) : "–");

  const computed: Record<string, Pick<StatCardData, "value" | "note" | "noteTone">> = {
    "due-today": {
      value: show(dueToday.length),
      note: ready ? `${dueTodayOpen} still to do` : "",
      noteTone: "teal",
    },
    awaiting: {
      value: show(awaitingCount),
      note: "Acceptance not tracked yet",
      noteTone: "amber",
    },
    overdue: {
      value: show(overdueCount),
      note: overdueCount > 0 ? "Needs a little attention" : "Nothing overdue",
      noteTone: overdueCount > 0 ? "red" : "teal",
    },
    "completed-week": {
      value: show(completedWeekCount),
      note: "Completed in the last 7 days",
      noteTone: "teal",
    },
  };

  const cards: StatCardData[] = statCards.map((card) => ({ ...card, ...computed[card.id] }));

  return (
    <main id="main" className="flex flex-1 flex-col gap-6 px-4 py-6 sm:px-8">
      <PageHeader onAddTask={() => setAddOpen(true)} />

      <CareRecipientBanner />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <StatCard key={card.id} card={card} />
        ))}
      </div>

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <TodayTasks members={members} onAddTask={() => setAddOpen(true)} />

        <div className="flex min-w-0 flex-col gap-6">
          <UpcomingAppointments />
          <AttentionNeeded />
        </div>
      </div>

      <RecentActivity />

      <TaskDialog
        open={addOpen}
        onClose={() => setAddOpen(false)}
        members={members}
        onSubmit={(input) => {
          addTask(input);
          setAddOpen(false);
        }}
      />
    </main>
  );
}
