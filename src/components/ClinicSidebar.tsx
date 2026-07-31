import { useEffect, useState, type ReactNode } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { 
  Home, 
  User, 
  UserPlus, 
  Users, 
  LogOut, 
  Menu, 
  X, 
  Building2, 
  ShelvingUnit, 
  Wallet, 
  TrendingUp, 
  UserCheck, 
  Network, 
  CalendarCheck, 
  BedDouble, 
  Hospital, 
  ReceiptText, 
  Wrench, 
  Truck, 
  MessageSquare,
  ChevronLeft,
  ChevronRight
} from "lucide-react";

interface MenuItem {
  name: string;
  path: string;
  icon: ReactNode;
}

interface MenuGroup {
  groupName: string;
  items: MenuItem[];
}

const ClinicSidebar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  const [isDesktop, setIsDesktop] = useState<boolean>(window.innerWidth >= 768);
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    const saved = localStorage.getItem("clinic_sidebar_collapsed");
    return saved !== "false";
  });

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

  const userRole = localStorage.getItem("userRole");
  const userPermissionsStr = localStorage.getItem("userPermissions");
  const userPermissions = userPermissionsStr ? JSON.parse(userPermissionsStr) : [];
  
  const clinicFeaturesStr = localStorage.getItem("clinicFeatures");
  const clinicFeatures: string[] = clinicFeaturesStr ? JSON.parse(clinicFeaturesStr) : ["opd", "emr", "patients"]; // Default to basic if missing

  const isAllowed = (path: string) => {
    // Determine the required SaaS feature for the path
    let requiredFeature = "";
    if (["billing-ledger", "expense-management", "clinic-revenue"].includes(path)) requiredFeature = "billing";
    if (["hr-management", "user-management", "department-management"].includes(path)) requiredFeature = "hr";
    if (["ward-management", "ipd-admissions"].includes(path)) requiredFeature = "ipd";
    if (["inventory-management", "supplier-management", "asset-management"].includes(path)) requiredFeature = "inventory";
    if (["communication-hub"].includes(path)) requiredFeature = "communication";
    if (["audit-logs"].includes(path)) requiredFeature = "Audit Logs";
    if (["referrals", "referral-analytics"].includes(path)) requiredFeature = "Referrals";

    // If a required SaaS feature is not enabled for this clinic, block it for EVERYONE
    if (requiredFeature) {
      const hasFeature = clinicFeatures.some(f => f.toLowerCase() === requiredFeature.toLowerCase());
      if (!hasFeature) return false;
    }

    // Default dashboard and profile should always be visible
    if (path === "clinic-home-dashboard" || path === "clinic-profile") return true;

    // If no role is set, assume it's the clinic owner/admin
    if (!userRole || userRole === "Admin" || userRole === "Clinic/Hospital") return true;

    // Role-based baseline access
    if (userRole === "Receptionist") {
      const allowed = ["clinic-home-dashboard", "clinic-profile", "referrals", "referral-analytics", "all-clinic-doctors", "all-clinic-patients", "ward-management", "ipd-admissions", "communication-hub"];
      if (allowed.includes(path)) return true;
    }
    if (userRole === "Cashier" || userRole === "Accountant") {
      const allowed = ["clinic-home-dashboard", "clinic-profile", "billing-ledger", "expense-management", "clinic-revenue"];
      if (allowed.includes(path)) return true;
    }
    if (userRole === "HR") {
      const allowed = ["clinic-home-dashboard", "clinic-profile", "user-management", "hr-management", "department-management"];
      if (allowed.includes(path)) return true;
    }
    if (userRole === "Store Manager") {
      const allowed = ["clinic-home-dashboard", "clinic-profile", "inventory-management", "supplier-management", "asset-management"];
      if (allowed.includes(path)) return true;
    }

    // Explicit permission overrides from user creation array
    if (userPermissions.includes("billing") && ["billing-ledger", "expense-management", "clinic-revenue"].includes(path)) return true;
    if (userPermissions.includes("hr") && ["hr-management", "user-management", "department-management"].includes(path)) return true;
    if (userPermissions.includes("inventory") && ["inventory-management", "supplier-management", "asset-management"].includes(path)) return true;
    if (userPermissions.includes("opd") && ["all-clinic-patients", "all-clinic-doctors", "add-doctor"].includes(path)) return true;
    if (userPermissions.includes("ipd") && ["ward-management", "ipd-admissions"].includes(path)) return true;

    return false;
  };

  const handleLogout = () => {
    localStorage.removeItem("clinic_portal_token");
    localStorage.removeItem("clinicToken");
    localStorage.removeItem("authTokenClinic");
    localStorage.removeItem("clinicId");
    localStorage.removeItem("userRole");
    localStorage.removeItem("userPermissions");
    navigate("/");
  };

  const menuGroups: MenuGroup[] = [
    {
      groupName: "General",
      items: [
        {
          name: "Dashboard",
          path: "clinic-home-dashboard",
          icon: <Home className="w-5 h-5" />,
        },
        { name: "My Profile", path: "clinic-profile", icon: <User className="w-5 h-5" /> },
      ]
    },
    {
      groupName: "Clinical",
      items: [
        {
          name: "Patients",
          path: "all-clinic-patients",
          icon: <Users className="w-5 h-5" />,
        },
        {
          name: "All Doctors",
          path: "all-clinic-doctors",
          icon: <User className="w-5 h-5" />,
        },
        { name: "Add Doctor", path: "add-doctor", icon: <UserPlus className="w-5 h-5" /> },
        {
          name: "Wards & Beds",
          path: "ward-management",
          icon: <BedDouble className="w-5 h-5" />,
        },
        {
          name: "IPD Admissions",
          path: "ipd-admissions",
          icon: <Hospital className="w-5 h-5" />,
        },
      ]
    },
    {
      groupName: "Financials",
      items: [
        {
          name: "Billing & Invoicing",
          path: "billing-ledger",
          icon: <ReceiptText className="w-5 h-5" />,
        },
        {
          name: "Expenses",
          path: "expense-management",
          icon: <Wallet className="w-5 h-5" />,
        },
        {
          name: "Revenue",
          path: "clinic-revenue",
          icon: <TrendingUp className="w-5 h-5" />,
        },
        {
          name: "Supplier Ledgers",
          path: "supplier-management",
          icon: <Truck className="w-5 h-5" />,
        },
      ]
    },
    {
      groupName: "HR & Operations",
      items: [
        {
          name: "Staff & Users",
          path: "user-management",
          icon: <UserCheck className="w-5 h-5" />,
        },
        {
          name: "Departments",
          path: "department-management",
          icon: <Network className="w-5 h-5" />,
        },
        {
          name: "HR & Attendance",
          path: "hr-management",
          icon: <CalendarCheck className="w-5 h-5" />,
        },
        {
          name: "Inventory",
          path: "inventory-management",
          icon: <ShelvingUnit className="w-5 h-5" />,
        },
        {
          name: "Asset Maintenance",
          path: "asset-management",
          icon: <Wrench className="w-5 h-5" />,
        },
      ]
    },
    {
      groupName: "Network & Audits",
      items: [
        {
          name: "Referral Network",
          path: "referrals",
          icon: <Network className="w-5 h-5" />,
        },
        {
          name: "Referral Analytics",
          path: "referral-analytics",
          icon: <TrendingUp className="w-5 h-5" />,
        },
        {
          name: "Communications",
          path: "communication-hub",
          icon: <MessageSquare className="w-5 h-5" />,
        },
        {
          name: "Audit Logs",
          path: "audit-logs",
          icon: <Network className="w-5 h-5" />,
        },
      ]
    }
  ];

  // Filter groups
  const filteredGroups = menuGroups
    .map(group => ({
      ...group,
      items: group.items.filter(item => isAllowed(item.path))
    }))
    .filter(group => group.items.length > 0);

  const sidebarWidth = isDesktop ? (isCollapsed ? "w-20" : "w-72") : "w-72";

  return (
    <>
      {/* ---------- MOBILE TOP BAR ---------- */}
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

      {/* ---------- SIDEBAR ---------- */}
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
        {/* Desktop Title / Logo */}
        <div className={`hidden md:flex items-center border-b border-gray-200 py-5 ${isCollapsed ? "justify-center px-4" : "gap-3 px-6"}`}>
          <div className="w-10 h-10 bg-[#0c213e] rounded-xl flex items-center justify-center shadow-md flex-shrink-0">
            <Building2 className="w-5 h-5 text-white" />
          </div>
          {!isCollapsed && (
            <div className="overflow-hidden transition-all duration-300">
              <h2 className="text-lg font-bold text-gray-900 whitespace-nowrap">DoctorZ</h2>
              <p className="text-xs text-gray-700 whitespace-nowrap">Clinic Dashboard</p>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 overflow-y-auto no-scrollbar">
          <div className="space-y-4">
            {filteredGroups.map((group) => (
              <div key={group.groupName} className="space-y-1">
                {/* Group Title or Divider */}
                {!isCollapsed ? (
                  <h3 className="px-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 mt-4 first:mt-0">
                    {group.groupName}
                  </h3>
                ) : (
                  group !== filteredGroups[0] && <div className="h-px bg-gray-100 my-3 mx-2" />
                )}

                {group.items.map((item) => {
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
                      <span
                        className={`${
                          isActive ? "text-white" : "text-gray-650"
                        } flex items-center justify-center flex-shrink-0`}
                      >
                        {item.icon}
                      </span>
                      
                      {!isCollapsed ? (
                        <span className="font-medium text-sm whitespace-nowrap opacity-100 transition-opacity duration-200">
                          {item.name}
                        </span>
                      ) : (
                        <span className={`text-[9px] font-semibold tracking-tight w-full truncate max-w-[68px] ${isActive ? "text-blue-100" : "text-gray-500"}`}>
                          {item.name}
                        </span>
                      )}

                      {isActive && !isCollapsed && (
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-white rounded-r-full"></div>
                      )}
                    </Link>
                  );
                })}
              </div>
            ))}
          </div>
        </nav>

        {/* Toggle Button for Desktop */}
        {isDesktop && (
          <div className="p-4 border-t border-gray-200">
            <button
              onClick={() => {
                const newState = !isCollapsed;
                setIsCollapsed(newState);
                localStorage.setItem("clinic_sidebar_collapsed", String(newState));
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

        {/* Logout Button */}
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={handleLogout}
            className={`flex items-center rounded-xl bg-red-50 hover:bg-red-100 transition-all text-red-600 w-full group relative cursor-pointer ${
              isCollapsed ? "justify-center p-3" : "gap-3 px-4 py-3"
            }`}
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
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
          <X className="w-5 h-5 text-gray-600" />
        </button>
      </aside>
    </>
  );
};

export default ClinicSidebar;
