import { useShipmentStore } from "../store/useShipmentStore";
import { useInvoiceStore } from "../store/useInvoiceStore";
import { useAuthStore } from "../store/useAuthStore";
import ReportingDashboard from "../components/ReportingDashboard";

export default function ReportingPage() {
  const shipments = useShipmentStore((state) => state.shipments);
  const invoices = useInvoiceStore((state) => state.invoices);
  const currentUser = useAuthStore((state) => state.currentUser);

  const isAuthorized =
    currentUser?.role === "super_admin" || currentUser?.role === "admin";

  if (!isAuthorized) {
    return (
      <div className="max-w-md mx-auto mt-20 bg-white border border-rose-200 rounded-xl p-6 text-center shadow-md space-y-4">
        <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto text-xl font-bold">
          ⚠️
        </div>
        <h3 className="text-sm font-bold text-slate-900">Access Denied</h3>
        <p className="text-xs text-slate-500">
          The Operations Analytics Dashboard is strictly restricted to Admins
          and Super Admins. Please select another role in the sidebar or top
          bar.
        </p>
      </div>
    );
  }

  return <ReportingDashboard shipments={shipments} invoices={invoices} />;
}
