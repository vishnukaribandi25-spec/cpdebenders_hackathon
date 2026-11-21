import EmptyState from "../../components/dashboard/EmptyState";
import PageHeader from "../../components/dashboard/PageHeader";

export default function CareCirclePage() {
  return (
    <main id="main" className="flex flex-1 flex-col gap-6 px-4 py-6 sm:px-8">
      <PageHeader title="Care Circle" subtitle="The family members sharing Lakshmi's care." showActions={false} />
      <div id="invite">
        <EmptyState
          id="care-circle-empty"
          title="Invite family members"
          message="Family members and invitations will be managed here. Invitations are not sent by email yet."
        />
      </div>
    </main>
  );
}
