import EmptyState from "../../components/dashboard/EmptyState";
import PageHeader from "../../components/dashboard/PageHeader";

export default function TimelinePage() {
  return (
    <main id="main" className="flex flex-1 flex-col gap-6 px-4 py-6 sm:px-8">
      <PageHeader title="Timeline" subtitle="A shared history of care." showActions={false} />
      <EmptyState
        id="timeline-empty"
        title="Nothing on the timeline yet"
        message="Activity will appear here as your family coordinates care."
      />
    </main>
  );
}
