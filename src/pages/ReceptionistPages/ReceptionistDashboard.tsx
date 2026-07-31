// 📁 ReceptionistDashboard.tsx
import { useState } from "react";
import Sidebar from "./ReceptionistDashboardSidebar";
import DashboardHome from "./ReceptionistHome";
import Doctors from "./ReceptionistDoctors";
import ReceptionistBookToken from "./ReceptionistBookToken";
import ReceptionistPatients from "./ReceptionistPatients";
import Profile from "./ReceptionistProfile";
import WalkInRegistration from "./WalkInRegistration";
import ReceptionistCollections from "./ReceptionistCollections";

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
      case "collections":
        return <ReceptionistCollections />;
      default:
        return <DashboardHome />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      <div className="flex-grow p-4 md:p-6 lg:p-8 w-full overflow-y-auto">
        {renderComponent()}
      </div>
    </div>
  );
}