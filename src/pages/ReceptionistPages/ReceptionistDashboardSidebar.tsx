import { useEffect, useState } from "react";
import {
  Home,
  Calendar,
  Users,
  User,
  LogOut,
  Menu,
  X,
  Building2,
  IndianRupee,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

interface Props {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export default function Sidebar({ activeTab, setActiveTab }: Props) {
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  const [isDesktop, setIsDesktop] = useState<boolean>(window.innerWidth >= 768);
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    const saved = localStorage.getItem("receptionist_sidebar_collapsed");
    return saved !== "false";
  });

  // Responsive handling
  useEffect(() => {
    const handleResize = () => setIsDesktop(window.innerWidth >= 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    setSidebarOpen(isDesktop);
  }, [isDesktop]);

  // Logout
  const handleLogout = () => {
    localStorage.removeItem("receptionToken");
    localStorage.removeItem("authTokenReception");
    localStorage.removeItem("receptionistId");
    window.location.href = "/";
  };

  const menu = [
    { id: "dashboard", label: "Dashboard", icon: <Home size={18} /> },
    { id: "bookToken", label: "Book Token", icon: <Calendar size={18} /> },
    { id: "doctors", label: "Doctors", icon: <Users size={18} /> },
    { id: "patients", label: "Patients", icon: <Calendar size={18} /> },
    { id: "collections", label: "Collections", icon: <IndianRupee size={18} /> },
    { id: "profile", label: "Profile", icon: <User size={18} /> },
  ];

  const sidebarWidth = isDesktop ? (isCollapsed ? "w-20" : "w-72") : "w-72";

  return (
    <>
      {/* 🔝 Mobile Top Bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 bg-white border-b flex items-center justify-between px-4 py-3 z-50 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-[#0c213e] rounded-lg flex items-center justify-center">
            <Building2 className="w-4 h-4 text-white" />
          </div>
          <h1 className="text-lg font-semibold text-gray-900">
            Receptionist
          </h1>
        </div>

        <button
          onClick={() => setSidebarOpen(true)}
          className="p-2 rounded-lg hover:bg-gray-100"
        >
          <Menu className="w-6 h-6" />
        </button>
      </div>

      {/* 🔲 Backdrop */}
      {!isDesktop && sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-black/50 z-30 backdrop-blur-sm"
        />
      )}

      {/* 📌 Sidebar */}
      <aside
        className={`
          bg-white border-r
          fixed md:relative
          z-40
          ${sidebarWidth} h-[calc(100vh-57px)] md:h-full
          transform transition-all duration-300
          top-14.25 md:top-0
          flex flex-col
          ${
            sidebarOpen
              ? "translate-x-0 shadow-2xl"
              : "-translate-x-full md:translate-x-0"
          }
        `}
      >
        {/* Desktop Header */}
        <div className={`hidden md:flex items-center border-b py-5 ${isCollapsed ? "justify-center px-4" : "gap-3 px-6"}`}>
          <div className="w-10 h-10 bg-[#0c213e] rounded-xl flex items-center justify-center flex-shrink-0">
            <Building2 className="w-5 h-5 text-white" />
          </div>
          {!isCollapsed && (
            <div className="overflow-hidden transition-all duration-300">
              <h2 className="text-lg font-bold text-gray-900 whitespace-nowrap">DoctorZ</h2>
              <p className="text-xs text-gray-500 whitespace-nowrap">Receptionist Panel</p>
            </div>
          )}
        </div>

        {/* Menu */}
        <nav className="flex-1 px-4 py-6 overflow-y-auto no-scrollbar">
          <div className="space-y-2">
            {menu.map((item) => {
              const isActive = activeTab === item.id;

              return (
                <div
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    if (!isDesktop) setSidebarOpen(false);
                  }}
                  className={`
                    flex transition-all relative group cursor-pointer
                    ${
                      isCollapsed 
                        ? "flex-col items-center justify-center p-2 rounded-xl gap-1 text-center" 
                        : "flex-row items-center gap-3 px-4 py-3 rounded-xl"
                    }
                    ${
                      isActive
                        ? "bg-[#0c213e] text-white shadow-md"
                        : "text-gray-700 hover:bg-gray-100"
                    }
                  `}
                >
                  <span className={`${isActive ? "text-white" : "text-gray-500"} flex items-center justify-center flex-shrink-0`}>
                    {item.icon}
                  </span>
                  
                  {!isCollapsed ? (
                    <span className="font-medium text-sm whitespace-nowrap opacity-100 transition-opacity duration-200">
                      {item.label}
                    </span>
                  ) : (
                    <span className={`text-[9px] font-semibold tracking-tight w-full truncate max-w-[68px] ${isActive ? "text-blue-100" : "text-gray-500"}`}>
                      {item.label}
                    </span>
                  )}

                  {isActive && !isCollapsed && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-white rounded-r-full"></div>
                  )}
                </div>
              );
            })}
          </div>
        </nav>

        {/* Toggle Button for Desktop */}
        {isDesktop && (
          <div className="p-4 border-t border-gray-200">
            <button
              onClick={() => {
                const newState = !isCollapsed;
                setIsCollapsed(newState);
                localStorage.setItem("receptionist_sidebar_collapsed", String(newState));
              }}
              className={`p-2 rounded-xl bg-gray-50 hover:bg-gray-100 text-gray-500 hover:text-gray-900 transition-colors w-full flex items-center border border-gray-100 cursor-pointer ${
                isCollapsed ? "justify-center" : "justify-start gap-3 px-4"
              }`}
            >
              {isCollapsed ? (
                <ChevronRight className="w-5 h-5" />
              ) : (
                <>
                  <ChevronLeft className="w-5 h-5" />
                  <span className="text-sm font-medium">Collapse Menu</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* 🚪 Logout */}
        <div className="p-4 border-t">
          <button
            onClick={handleLogout}
            className={`flex items-center rounded-xl bg-red-50 hover:bg-red-100 text-red-600 w-full group relative cursor-pointer ${
              isCollapsed ? "justify-center p-3" : "gap-3 px-4 py-3"
            }`}
          >
            <LogOut size={18} className="flex-shrink-0" />
            {!isCollapsed && <span className="font-medium text-sm">Logout</span>}
            
            {isCollapsed && (
              <span className="absolute left-full ml-4 px-3 py-2 bg-red-600 text-white text-xs font-semibold rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-all duration-200 translate-x-2 group-hover:translate-x-0 pointer-events-none whitespace-nowrap z-50">
                Logout
              </span>
            )}
          </button>
        </div>

        {/* ❌ Mobile Close */}
        <button
          onClick={() => setSidebarOpen(false)}
          className="absolute top-4 right-4 md:hidden"
        >
          <X className="w-5 h-5 text-gray-600" />
        </button>
      </aside>
    </>
  );
}