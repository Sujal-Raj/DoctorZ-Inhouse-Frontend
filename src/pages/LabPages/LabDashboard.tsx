import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { FlaskConical, Users, UserCircle, LogOut, Menu, X, Archive, Receipt, IndianRupee } from "lucide-react";
import { useState, useEffect } from "react";

export default function LabDashboard() {
  const location = useLocation();
  const navigate = useNavigate();
  const labId = localStorage.getItem("labId");

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 768);
  const [isHovered, setIsHovered] = useState<boolean>(false);
  const isVisualCollapsed = !isHovered;

  // Resize handling
  useEffect(() => {
    const handleResize = () => setIsDesktop(window.innerWidth >= 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Desktop always keeps sidebar open
  useEffect(() => {
    if (isDesktop) setSidebarOpen(true);
    else setSidebarOpen(false);
  }, [isDesktop]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("labId");
    localStorage.clear();
    navigate("/");
  };

  const labFeaturesStr = localStorage.getItem("labFeatures");
  const labFeatures = labFeaturesStr ? JSON.parse(labFeaturesStr) : ["referrals"];

  const isFeatureEnabled = (featureName: string) => {
    return labFeatures.some((f: string) => f.toLowerCase() === featureName.toLowerCase());
  };

  const allMenuItems = [
    { name: "Patients", path: "patients", icon: Users },
    { name: "Lab Tests", path: "tests", icon: FlaskConical },
    { name: "Lab Orders", path: "orders", icon: Archive },
    { name: "Inventory", path: "inventory", icon: Archive },
    { name: "Expenses", path: "expenses", icon: Receipt },
    { name: "Revenue", path: "revenue", icon: IndianRupee },
    { name: "Profile", path: "profile", icon: UserCircle },
    // Gated Features
    { name: "Referrals", path: "referrals", icon: Users, feature: "Referrals" },
    { name: "Audit Logs", path: "audit-logs", icon: Archive, feature: "Audit Logs" },
  ];

  const menuItems = allMenuItems.filter(item => {
    if (!item.feature) return true;
    return isFeatureEnabled(item.feature);
  });

  const sidebarWidth = isDesktop ? (isVisualCollapsed ? "w-20" : "w-72") : "w-72";

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 bg-white border-b border-gray-200 flex items-center justify-between px-4 py-3 z-50 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-[#0c213e] rounded-lg flex items-center justify-center">
            <FlaskConical className="w-4 h-4 text-white" />
          </div>
          <h1 className="text-lg font-semibold text-gray-900">Lab Dashboard</h1>
        </div>

        <button
          onClick={() => setSidebarOpen(true)}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <Menu className="w-6 h-6 text-gray-700" />
        </button>
      </div>

      {/* Backdrop */}
      {!isDesktop && sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-black/50 z-30 md:hidden backdrop-blur-sm"
        />
      )}

      {/* Sidebar */}
      <aside
        onMouseEnter={() => isDesktop && setIsHovered(true)}
        onMouseLeave={() => isDesktop && setIsHovered(false)}
        className={`
          bg-white border-r border-gray-200
          fixed md:relative 
          left-0
          z-40 
          ${sidebarWidth} h-[calc(100vh-57px)] md:h-full
          transform transition-all duration-300 ease-in-out
          top-[57px] md:top-0
          flex flex-col
          ${sidebarOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full md:translate-x-0"}
        `}
      >
        {/* Logo Section - Desktop Only */}
        <div className={`hidden md:flex items-center border-b border-gray-200 py-5 ${isVisualCollapsed ? "justify-center px-4" : "gap-3 px-6"}`}>
          <div className="w-10 h-10 bg-[#0c213e] rounded-xl flex items-center justify-center shadow-md flex-shrink-0">
            <FlaskConical className="w-5 h-5 text-white" />
          </div>
          {!isVisualCollapsed && (
            <div className="overflow-hidden transition-all duration-300">
              <h2 className="text-lg font-bold text-gray-900 ">DoctorZ</h2>
              <p className="text-xs text-gray-700">Lab Dashboard</p>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 overflow-y-auto no-scrollbar">
          <div className="space-y-1">
            {menuItems.map((item) => {
              const isActive = location.pathname.includes(item.path);
              const Icon = item.icon;

              return (
                <Link
                  key={item.path}
                  to={`/lab-dashboard/${item.path}`}
                  onClick={() => !isDesktop && setSidebarOpen(false)}
                  className={`
                    flex transition-all relative group cursor-pointer
                    ${
                      isVisualCollapsed 
                        ? "flex-col items-center justify-center p-2 rounded-xl gap-1 text-center" 
                        : "flex-row items-center gap-3 px-4 py-3 rounded-xl"
                    }
                    ${
                      isActive
                        ? "bg-[#0c213e] text-white shadow-lg shadow-[#0c213e]/20"
                        : "text-gray-700 hover:bg-gray-100"
                    }
                  `}
                >
                  <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? "text-white" : "text-gray-650"}`} />
                  
                  {!isVisualCollapsed ? (
                    <span className="font-medium text-sm whitespace-nowrap opacity-100 transition-opacity duration-200">
                      {item.name}
                    </span>
                  ) : (
                    <span className={`text-[9px] font-semibold tracking-tight w-full truncate max-w-[68px] ${isActive ? "text-blue-100" : "text-gray-500"}`}>
                      {item.name}
                    </span>
                  )}

                  {isActive && !isVisualCollapsed && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-white rounded-r-full"></div>
                  )}
                </Link>
              );
            })}
          </div>
        </nav>



        {/* Logout Section */}
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={handleLogout}
            className={`flex items-center rounded-xl bg-red-50 hover:bg-red-100 transition-all text-red-600 w-full group relative cursor-pointer ${
              isVisualCollapsed ? "justify-center p-3" : "gap-3 px-4 py-3"
            }`}
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {!isVisualCollapsed && <span className="font-medium text-sm">Logout</span>}
            
            {isVisualCollapsed && (
              <span className="absolute left-full ml-4 px-3 py-2 bg-red-600 text-white text-xs font-semibold rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-all duration-200 translate-x-2 group-hover:translate-x-0 pointer-events-none whitespace-nowrap z-50">
                Logout
              </span>
            )}
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

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pt-[57px] md:pt-0">
        <div className="p-4 md:p-6 lg:p-8 w-full">
          <Outlet context={{ labId }} />
        </div>
      </main>
    </div>
  );
}