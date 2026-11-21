import PageHeader from "../../components/dashboard/PageHeader";
import SettingsForm from "../../components/dashboard/SettingsForm";

export default function SettingsPage() {
  return (
    <main id="main" className="flex flex-1 flex-col gap-6 px-4 py-6 sm:px-8">
      <PageHeader title="Settings" subtitle="Names used across your care circle." showActions={false} />
      <SettingsForm />
    </main>
  );
}
