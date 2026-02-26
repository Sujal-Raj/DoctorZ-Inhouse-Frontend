import { Outlet } from "react-router-dom";
import ClinicSidebar from "../../components/ClinicSidebar";
import { useParams } from "react-router-dom";

export const ClinicDashboard = () => {
  const { clinicId } = useParams<{ clinicId: string }>();
  console.log("Clinic ID from URL:", clinicId);

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Main layout is controlled similar to LabDashboard */}
      <ClinicSidebar />

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pt-14.25 md:pt-0">
        <div className="p-6 md:p-8">
          <Outlet context={{ clinicId }} />
        </div>
      </main>
    </div>
  );
};
