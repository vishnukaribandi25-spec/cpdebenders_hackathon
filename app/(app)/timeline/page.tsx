import PageHeader from "../../components/dashboard/PageHeader";
import TimelineClient from "../../components/timeline/TimelineClient";

export default function TimelinePage() {
  return (
    <main id="main" className="flex flex-1 flex-col gap-6 px-4 py-6 sm:px-8">
      <PageHeader title="Timeline" subtitle="A shared history of care." showActions={false} />
      <TimelineClient />
    </main>
  );
}
