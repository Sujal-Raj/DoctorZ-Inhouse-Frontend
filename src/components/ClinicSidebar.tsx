import { useEffect, useState, type ReactNode } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Home, User, UserPlus, Users, LogOut, Menu, X, Building2, ShelvingUnit, Wallet, TrendingUp, UserCheck, Network, CalendarCheck, BedDouble, Hospital, ReceiptText, Wrench, Truck, MessageSquare } from "lucide-react";

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

  const userRole = localStorage.getItem("userRole");
  const userPermissionsStr = localStorage.getItem("userPermissions");
  const userPermissions = userPermissionsStr ? JSON.parse(userPermissionsStr) : [];
  
  const clinicFeaturesStr = localStorage.getItem("clinicFeatures");
  const clinicFeatures: string[] = clinicFeaturesStr ? JSON.parse(clinicFeaturesStr) : ["opd", "emr", "patients"]; // Default to basic if missing

  const isFeatureEnabled = (featureName: string) => {
    // If it's a basic feature, always return true, otherwise check clinicFeatures array
    if (["opd", "emr", "patients"].includes(featureName)) return true;
    return clinicFeatures.includes(featureName);
  };

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
      // For uppercase DB strings (like Audit Logs), let's make it case-insensitive or exact
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

  const allMenuItems: MenuItem[] = [
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
    {
      name: "Patients",
      path: "all-clinic-patients",
      icon: <Users className="w-5 h-5" />,
    },
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
      name: "Audit Logs",
      path: "audit-logs",
      icon: <Network className="w-5 h-5" />, // Or Shield
    },
    {
      name: "Inventory",
      path: "inventory-management",
      icon: <ShelvingUnit className="w-5 h-5" />,
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
      name: "Wards & Beds",
      path: "ward-management",
      icon: <BedDouble className="w-5 h-5" />,
    },
    {
      name: "IPD Admissions",
      path: "ipd-admissions",
      icon: <Hospital className="w-5 h-5" />,
    },
    {
      name: "Billing & Invoicing",
      path: "billing-ledger",
      icon: <ReceiptText className="w-5 h-5" />,
    },
    {
      name: "Asset Maintenance",
      path: "asset-management",
      icon: <Wrench className="w-5 h-5" />,
    },
    {
      name: "Supplier Ledgers",
      path: "supplier-management",
      icon: <Truck className="w-5 h-5" />,
    },
    {
      name: "Communications",
      path: "communication-hub",
      icon: <MessageSquare className="w-5 h-5" />,
    },
    { name: "My Profile", path: "clinic-profile", icon: <User className="w-5 h-5" /> },
  ];

  const menuItems = allMenuItems.filter(item => isAllowed(item.path));

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
