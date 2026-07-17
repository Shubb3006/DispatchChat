import { useShipmentStore } from "../store/useShipmentStore";
import CustomerDashboard from "../components/CustomerDashboard";

export default function CustomerPage() {
  const shipments = useShipmentStore((state) => state.shipments);
  return <CustomerDashboard shipments={shipments} />;
}
