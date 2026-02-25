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
} from "@heroicons/react/24/outline";

import {
  HomeIcon as HomeIconSolid,
  UserIcon as UserIconSolid,
  ClockIcon as ClockIconSolid,
  CalendarIcon as CalendarIconSolid,
  UsersIcon as UsersIconSolid,
  BellIcon as BellIconSolid,
  PlusIcon as PlusIconSolid,
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
          w-72 h-[calc(100vh-57px)] md:h-full
          transform transition-all duration-300 ease-in-out
          top-[57px] md:top-0
          flex flex-col
          ${sidebarOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full md:translate-x-0"}
        `}
      >
        {/* Logo Section - Desktop Only */}
        <div className="hidden md:flex items-center gap-3 px-6 py-5 border-b border-gray-200">
          <div className="w-10 h-10 bg-[#0c213e] rounded-xl flex items-center justify-center shadow-md">
            <div className="w-5 h-5 border-2 border-white rounded"></div>
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">DOCTORZ</h2>
            <p className="text-xs text-gray-500">Doctor Dashboard</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 overflow-y-auto">
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
                    flex items-center gap-3 px-4 py-3 rounded-xl transition-all relative group
                    ${
                      isActive
                        ? "bg-[#0c213e] text-white shadow-lg shadow-[#0c213e]/20"
                        : "text-gray-700 hover:bg-gray-100"
                    }
                  `}
                >
                  <Icon className={`w-5 h-5 ${isActive ? "text-white" : "text-gray-600"}`} />
                  <span className="font-medium">{item.name}</span>
                  
                  {item.badge && item.badge > 0 && (
                    <span className={`
                      ml-auto px-2 py-0.5 text-xs font-bold rounded-full
                      ${isActive ? "bg-white text-[#0c213e]" : "bg-red-500 text-white"}
                    `}>
                      {item.badge > 99 ? "99+" : item.badge}
                    </span>
                  )}

                  {isActive && (
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
            className="flex items-center gap-3 px-4 py-3 rounded-xl bg-red-50 hover:bg-red-100 transition-all text-red-600 w-full group"
          >
            <ArrowRightOnRectangleIcon className="w-5 h-5" />
            <span className="font-medium">Logout</span>
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
        <div className="p-6 md:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}