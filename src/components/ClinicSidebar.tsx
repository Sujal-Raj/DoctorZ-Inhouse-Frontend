import { useEffect, useState, type ReactNode } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Home, User, UserPlus, Users, LogOut, Menu, X, Building2 } from "lucide-react";

interface MenuItem {
  name: string;
  path: string;
  icon: ReactNode;
}

const ClinicSidebar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  const [isDesktop, setIsDesktop] = useState<boolean>(window.innerWidth >= 768);

  // Detect window resize
  useEffect(() => {
    const handleResize = () => setIsDesktop(window.innerWidth >= 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Desktop always open
  useEffect(() => {
    setSidebarOpen(isDesktop);
  }, [isDesktop]);

  const handleLogout = () => {
    localStorage.removeItem("clinic_portal_token");
    navigate("/");
  };

  const menuItems: MenuItem[] = [
    {
      name: "Dashboard",
      path: "clinic-home-dashboard",
      icon: <Home className="w-5 h-5" />,
    },
    {
      name: "All Doctor Profiles",
      path: "all-clinic-doctors",
      icon: <User className="w-5 h-5" />,
    },
    { name: "Add Doctor", path: "add-doctor", icon: <UserPlus className="w-5 h-5" /> },
    { name: "My Profile", path: "clinic-profile", icon: <User className="w-5 h-5" /> },
    {
      name: "Patients",
      path: "all-clinic-patients",
      icon: <Users className="w-5 h-5" />,
    },
  ];

  return (
    <>
      {/* ---------- MOBILE TOP BAR (similar to LabDashboard) ---------- */}
      <div className="md:hidden fixed top-0 left-0 right-0 bg-white border-b border-gray-200 flex items-center justify-between px-4 py-3 z-50 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-[#0c213e] rounded-lg flex items-center justify-center">
            <Building2 className="w-4 h-4 text-white" />
          </div>
          <h1 className="text-lg font-semibold text-gray-900">Clinic Dashboard</h1>
        </div>

        <button
          onClick={() => setSidebarOpen(true)}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <Menu className="w-6 h-6 text-gray-700" />
        </button>
      </div>

      {/* ---------- BACKDROP ---------- */}
      {!isDesktop && sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-black/50 z-30 md:hidden backdrop-blur-sm"
        />
      )}

      {/* ---------- SIDEBAR (styled like LabDashboard) ---------- */}
      <aside
        className={`
          bg-white border-r border-gray-200
          fixed md:relative
          left-0
          z-40
          w-72 h-[calc(100vh-57px)] md:h-full
          transform transition-all duration-300 ease-in-out
          top-[57px] md:top-0
          flex flex-col
          ${sidebarOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full md:translate-x-0"}
        `}
      >
        {/* Desktop Title / Logo */}
        <div className="hidden md:flex items-center gap-3 px-6 py-5 border-b border-gray-200">
          <div className="w-10 h-10 bg-[#0c213e] rounded-xl flex items-center justify-center shadow-md">
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">DoctorZ</h2>
            <p className="text-xs text-gray-700">Clinic Dashboard</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 overflow-y-auto">
          <div className="space-y-1">
            {menuItems.map((item: MenuItem) => {
              // keep your existing active logic
              const isActive = (() => {
                const fullPath = location.pathname;
                const baseDashboard = fullPath.split("/").slice(0, 3).join("/");

                if (item.path === "clinic-home-dashboard") {
                  if (fullPath === baseDashboard) return true;
                  if (fullPath.endsWith("clinic-home-dashboard")) return true;
                  return false;
                }

                return fullPath.endsWith(item.path);
              })();

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => !isDesktop && setSidebarOpen(false)}
                  className={`
                    flex items-center gap-3 px-4 py-3 rounded-xl transition-all relative group
                    ${
                      isActive
                        ? "bg-[#0c213e] text-white shadow-lg shadow-[#0c213e]/20"
                        : "text-gray-700 hover:bg-gray-100"
                    }
                  `}
                >
                  <span
                    className={`${
                      isActive ? "text-white" : "text-gray-600"
                    } flex items-center justify-center`}
                  >
                    {item.icon}
                  </span>
                  <span className="font-medium">{item.name}</span>

                  {isActive && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-white rounded-r-full"></div>
                  )}
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Logout Button (styled like LabDashboard) */}
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 rounded-xl bg-red-50 hover:bg-red-100 transition-all text-red-600 w-full group"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Logout</span>
          </button>
        </div>

        {/* Mobile Close Button */}
        <button
          onClick={() => setSidebarOpen(false)}
          className="absolute top-4 right-4 p-2 rounded-lg hover:bg-gray-100 transition-colors md:hidden"
        >
          <X className="w-5 h-5 text-gray-600" />
        </button>
      </aside>
    </>
  );
};

export default ClinicSidebar;
