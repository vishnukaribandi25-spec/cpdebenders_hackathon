import CareCircleClient from "../../components/care-circle/CareCircleClient";
import PageHeader from "../../components/dashboard/PageHeader";

export default function CareCirclePage() {
  return (
    <main id="main" className="flex flex-1 flex-col gap-6 px-4 py-6 sm:px-8">
      <PageHeader title="Care Circle" subtitle="The family members sharing Lakshmi's care." showActions={false} />
      <div id="invite">
        <CareCircleClient />
      </div>
    </main>
  );
}
