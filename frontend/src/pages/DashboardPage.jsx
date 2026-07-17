import { useAuthStore } from "../store/useAuthStore";

import Navigation from "../components/Navigation";
import DispatcherDashboard from "../components/DispatcherDashboard";
import DriverApp from "../components/DriverApp";
import DriverManagerHub from "../components/DriverManagerHub";
import SafetyDashboard from "../components/SafetyDashboard";
import InvoicingDashboard from "../components/InvoicingDashboard";
import CustomerDashboard from "../components/CustomerDashboard";
import ReportingDashboard from "../components/ReportingDashboard";
import HRDashboard from "../components/HRDashboard";
import { useState } from "react";

const DashboardPage = () => {
  const { authUser, logout } = useAuthStore();
  console.log(authUser);

  if (!authUser) return null;
  const [currentRole, setCurrentRole] = useState("dispatcher");

  return (
    <div className="flex h-screen">
      <Navigation
        currentRole={authUser?.role}
        currentUser={authUser}
        onLogout={() => logout()}
        onChangeRole={setCurrentRole}
      />

      <div className="flex-1">
        {/* {(currentRole === "admin" ||
          "ADMIN" ||
          currentRole === "super_admin" ||
          "SUPE_ADMIN") && <ReportingDashboard />}
        {currentRole   === "dispatcher" ||
          ("DISPATCHER" && <DispatcherDashboard />)}

        {authUser.role === "driver" || ("DRIVER" && <DriverApp />)}

        {authUser.role === "driver_managerÆ || ÆDRIVER_MANAGER" && (
          <DriverManagerHub />
        )}

        {authUser.role === "safety" && <SafetyDashboard />}

        {authUser.role === "invoicing" && <InvoicingDashboard />}

        {authUser.role === "customer" || ("CUSTOMER" && <CustomerDashboard />)}

        {authUser.role === "hr" && <HRDashboard />} */}
      </div>
    </div>
  );
};

export default DashboardPage;
