// 📁 ReceptionistDashboard.tsx
import { useState } from "react";
import Sidebar from "./ReceptionistDashboardSidebar";
import DashboardHome from "./ReceptionistHome";
import Appointments from "./WalkInRegistration";
import Doctors from "./ReceptionistDoctors";
import ReceptionistBookToken from "./ReceptionistBookToken";
import ReceptionistPatients from "./ReceptionistPatients";
import Profile from "./ReceptionistProfile";
import WalkInRegistration from "./WalkInRegistration";

export default function ReceptionistDashboard() {
  const [activeTab, setActiveTab] = useState("dashboard");

  const renderComponent = () => {
    switch (activeTab) {
      case "dashboard":
        return <DashboardHome />;
      case "walkin":
        return <WalkInRegistration />;
      case "doctors":
        return <Doctors />;
      case "bookToken":
        return <ReceptionistBookToken/>  
      case "patients":
        return <ReceptionistPatients/>  
      case "profile":
        return <Profile />;
      default:
        return <DashboardHome />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      <div className="flex-1 p-6 overflow-y-auto">
        {renderComponent()}
      </div>
    </div>
  );
}