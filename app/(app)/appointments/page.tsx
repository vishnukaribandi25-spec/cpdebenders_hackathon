import AppointmentsClient from "../../components/appointments/AppointmentsClient";
import PageHeader from "../../components/dashboard/PageHeader";

export default function AppointmentsPage() {
  return (
    <main id="main" className="flex flex-1 flex-col gap-6 px-4 py-6 sm:px-8">
      <PageHeader title="Appointments" subtitle="Upcoming visits and care appointments." showActions={false} />
      <AppointmentsClient />
    </main>
  );
}

