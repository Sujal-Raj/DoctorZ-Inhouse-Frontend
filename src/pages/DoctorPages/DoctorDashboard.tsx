import { useEffect, useState } from "react";
import {
  Link,
  Outlet,
  useLocation,
  useNavigate,
} from "react-router-dom";
import {
  HomeIcon,
  UserIcon,
  ClockIcon,
  CalendarIcon,
  UsersIcon,
  BellIcon,
  XMarkIcon,
  ArrowRightOnRectangleIcon,
  Bars3Icon,
  PlusIcon,
  BanknotesIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "@heroicons/react/24/outline";

import {
  HomeIcon as HomeIconSolid,
  UserIcon as UserIconSolid,
  ClockIcon as ClockIconSolid,
  CalendarIcon as CalendarIconSolid,
  UsersIcon as UsersIconSolid,
  BellIcon as BellIconSolid,
  PlusIcon as PlusIconSolid,
  BanknotesIcon as BanknotesIconSolid,
} from "@heroicons/react/24/solid";
import api from "../../Services/mainApi";

interface Notification {
  _id: string;
  message: string;
  status: "pending" | "seen";
  createdAt: string;
}

export default function DoctorDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 768);
  const [newNotifCount, setNewNotifCount] = useState(0);
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    const saved = localStorage.getItem("doctor_sidebar_collapsed");
    return saved !== "false";
  });

  // Detect screen size
  useEffect(() => {
    const handleResize = () => setIsDesktop(window.innerWidth >= 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Auto open/close depending on screen
  useEffect(() => {
    if (isDesktop) setSidebarOpen(true);
    else setSidebarOpen(false);
  }, [isDesktop]);

  const handleLogout = () => {
    localStorage.removeItem("doctorId");
    localStorage.removeItem("token");
    localStorage.clear();
    navigate("/");
  };

  const doctorId = localStorage.getItem("doctorId");

  // Fetch notifications
  const fetchNotificationCount = async () => {
    try {
      const res = await api.get<{ notifications: Notification[] }>(
        `/api/doctor/notifications/${doctorId}`
      );

      const pendingCount = res.data.notifications.filter(
        (n: any) => n.status === "pending"
      ).length;

      setNewNotifCount(pendingCount);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    fetchNotificationCount();
    const interval = setInterval(fetchNotificationCount, 10000);
    return () => clearInterval(interval);
  }, [doctorId]);

  const menuItems = [
    {
      name: "Dashboard",
      path: "doctor-home-dashboard",
      icon: HomeIcon,
      iconSolid: HomeIconSolid,
    },
    {
      name: "Appointments",
      path: "appointments",
      icon: CalendarIcon,
      iconSolid: CalendarIconSolid,
    },
    {
      name: "My Patients",
      path: "patients",
      icon: UsersIcon,
      iconSolid: UsersIconSolid,
    },
    {
      name: "Availability",
      path: "time-slots",
      icon: ClockIcon,
      iconSolid: ClockIconSolid,
    },
    {
      name: "Notifications",
      path: "notifications",
      icon: BellIcon,
      iconSolid: BellIconSolid,
      badge: newNotifCount,
    },
    {
      name: "Earnings",
      path: "earnings",
      icon: BanknotesIcon,
      iconSolid: BanknotesIconSolid,
    },
    {
      name: "Profile",
      path: "doctorProfile",
      icon: UserIcon,
      iconSolid: UserIconSolid,
    },
    {
      name: "Add Medicine",
      path: "add-medicine",
      icon: PlusIcon,
      iconSolid: PlusIconSolid,
    },
  ];

  const basePath = `/doctordashboard/${doctorId}`;
  const sidebarWidth = isDesktop ? (isCollapsed ? "w-20" : "w-72") : "w-72";

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 bg-white border-b border-gray-200 flex items-center justify-between px-4 py-3 z-50 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-[#0c213e] rounded-lg flex items-center justify-center">
            <div className="w-4 h-4 border-2 border-white rounded"></div>
          </div>
          <h1 className="text-lg font-semibold text-gray-900">Dashboard</h1>
        </div>

        <button
          onClick={() => setSidebarOpen(true)}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <Bars3Icon className="w-6 h-6 text-gray-700" />
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
        <div className={`hidden md:flex items-center border-b border-gray-200 py-5 ${isCollapsed ? "justify-center px-4" : "gap-3 px-6"}`}>
          <div className="w-10 h-10 bg-[#0c213e] rounded-xl flex items-center justify-center shadow-md flex-shrink-0">
            <div className="w-5 h-5 border-2 border-white rounded"></div>
          </div>
          {!isCollapsed && (
            <div className="overflow-hidden transition-all duration-300">
              <h2 className="text-lg font-bold text-gray-900 whitespace-nowrap">DOCTORZ</h2>
              <p className="text-xs text-gray-500 whitespace-nowrap">Doctor Dashboard</p>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 overflow-y-auto no-scrollbar">
          <div className="space-y-1">
            {menuItems.map((item) => {
              const isActive =
                item.path === "appointments"
                  ? location.pathname === basePath ||
                    location.pathname.startsWith(`${basePath}/appointments`)
                  : location.pathname.startsWith(`${basePath}/${item.path}`);

              const Icon = isActive ? item.iconSolid : item.icon;

              return (
                <Link
                  key={item.name}
                  to={
                    item.path === "appointments"
                      ? `${basePath}/appointments`
                      : `${basePath}/${item.path}`
                  }
                  onClick={() => !isDesktop && setSidebarOpen(false)}
                  className={`
                    flex transition-all relative group cursor-pointer
                    ${
                      isCollapsed 
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
                  
                  {!isCollapsed ? (
                    <span className="font-medium text-sm whitespace-nowrap opacity-100 transition-opacity duration-200">
                      {item.name}
                    </span>
                  ) : (
                    <span className={`text-[9px] font-semibold tracking-tight w-full truncate max-w-[68px] ${isActive ? "text-blue-100" : "text-gray-500"}`}>
                      {item.name}
                    </span>
                  )}
                  
                  {item.badge && item.badge > 0 && !isCollapsed && (
                    <span className={`
                      ml-auto px-2 py-0.5 text-xs font-bold rounded-full
                      ${isActive ? "bg-white text-[#0c213e]" : "bg-red-500 text-white"}
                    `}>
                      {item.badge > 99 ? "99+" : item.badge}
                    </span>
                  )}

                  {item.badge && item.badge > 0 && isCollapsed && (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white"></span>
                  )}

                  {isActive && !isCollapsed && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-white rounded-r-full"></div>
                  )}
                </Link>
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
                localStorage.setItem("doctor_sidebar_collapsed", String(newState));
              }}
              className={`p-2 rounded-xl bg-gray-50 hover:bg-gray-100 text-gray-500 hover:text-gray-900 transition-colors w-full flex items-center border border-gray-100 cursor-pointer ${
                isCollapsed ? "justify-center" : "justify-start gap-3 px-4"
              }`}
            >
              {isCollapsed ? (
                <ChevronRightIcon className="w-5 h-5" />
              ) : (
                <>
                  <ChevronLeftIcon className="w-5 h-5" />
                  <span className="text-sm font-medium">Collapse Menu</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* Logout Section */}
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={handleLogout}
            className={`flex items-center rounded-xl bg-red-50 hover:bg-red-100 transition-all text-red-600 w-full group relative cursor-pointer ${
              isCollapsed ? "justify-center p-3" : "gap-3 px-4 py-3"
            }`}
          >
            <ArrowRightOnRectangleIcon className="w-5 h-5 flex-shrink-0" />
            {!isCollapsed && <span className="font-medium text-sm">Logout</span>}
            
            {isCollapsed && (
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
          <XMarkIcon className="w-5 h-5 text-gray-600" />
        </button>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pt-[57px] md:pt-0">
        <div className="p-4 md:p-6 lg:p-8 w-full">
          <Outlet />
        </div>
      </main>
    </div>
  );
}