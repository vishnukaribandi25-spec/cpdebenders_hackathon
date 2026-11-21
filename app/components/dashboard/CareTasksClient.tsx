"use client";

import { useState } from "react";
import { careCircleMembers, currentUser } from "../../lib/mock-data";
import { useTasks } from "../../lib/use-tasks";
import PageHeader from "./PageHeader";
import TaskDialog from "./TaskDialog";
import TodayTasks from "./TodayTasks";

// Members who can be assigned tasks. Vishnu is included so "Assigned to me" works.
const members = [currentUser, ...careCircleMembers];

/**
 * Care Tasks page body. Owns the add dialog, opened from the page header and
 * from the empty state in TodayTasks, the same way DashboardClient does.
 */
export default function CareTasksClient() {
  const { addTask } = useTasks();
  const [addOpen, setAddOpen] = useState(false);

  return (
    <main id="main" className="flex flex-1 flex-col gap-6 px-4 py-6 sm:px-8">
      <PageHeader
        title="Care Tasks"
        subtitle="Everything that needs doing for Lakshmi."
        onAddTask={() => setAddOpen(true)}
      />

      <TodayTasks members={members} onAddTask={() => setAddOpen(true)} />

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
