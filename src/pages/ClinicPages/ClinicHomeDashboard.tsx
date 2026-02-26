import React, { useEffect, useState } from "react";
import {
  UserGroupIcon,
  CalendarDaysIcon,
  UserIcon,
  ClockIcon,
} from "@heroicons/react/24/solid";
import {
  ChartBarIcon,
  UsersIcon,
  UserPlusIcon,
  ArrowRightIcon,
} from "@heroicons/react/24/outline";
import api from "../../Services/mainApi";
import { useNavigate } from "react-router-dom";

interface Clinic {
  _id: string;
  clinicId: string;
  clinicName: string;
  email: string;
}

interface ClinicStats {
  totalDoctors: number;
  totalDepartments: number;
}

interface ClinicResponse {
  clinic: Clinic;
  message: string;
}

interface StatsResponse {
  stats: ClinicStats;
  message: string;
}

const ClinicHomeDashboard: React.FC = () => {
  const [clinic, setClinic] = useState<Clinic | null>(null);
  const [clinicStats, setClinicStats] = useState<ClinicStats>({
    totalDoctors: 0,
    totalDepartments: 0,
  });
  const [dateTime, setDateTime] = useState("");
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();
  const token = localStorage.getItem("clinicToken");
  const clinicId = localStorage.getItem("clinicId");

  // Date/time updater
  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date();
      const formatted = now.toLocaleString("en-IN", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
      setDateTime(formatted);
    };
    updateDateTime();
    const timer = setInterval(updateDateTime, 60000);
    return () => clearInterval(timer);
  }, []);

  // Fetch clinic info
  useEffect(() => {
    if (!token || !clinicId) {
      navigate(`/clinicDashboard/${clinicId || ""}`);
      return;
    }

    const fetchClinic = async () => {
      try {
        const res = await api.get<ClinicResponse>(
          `/api/clinic/getClinicById/${clinicId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setClinic(res.data.clinic);
      } catch (err) {
        console.error("Error fetching clinic:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchClinic();
  }, [token, clinicId, navigate]);

  // Fetch stats
  useEffect(() => {
    if (!token || !clinicId) return;

    const fetchClinicStats = async () => {
      try {
        const res = await api.get<StatsResponse>(
        `/api/clinic/getClinicStats/${clinicId}`,
        { headers: { Authorization: `Bearer ${token}` } }
        );
        setClinicStats(res.data.stats);
      } catch (err) {
        console.error("Error fetching clinic stats:", err);
      }
    };

    fetchClinicStats();
  }, [token, clinicId]);

  const [hoveredCard, setHoveredCard] = useState<number | null>(null);
  const [hoveredCTA, setHoveredCTA] = useState<number | null>(null);

  if (loading) {
    return (
      <p className="text-center mt-10 text-gray-500">
        Loading dashboard...
      </p>
    );
  }

  // Stats cards backed by real API data + one derived
  const statsCards = [
    {
      title: "Total Doctors",
      value: clinicStats.totalDoctors,
      icon: <UserGroupIcon className="w-8 h-8" />,
      color: "#00D09C",
      bgColor: "bg-emerald-50",
      change: "",
    },
    {
      title: "Departments",
      value: clinicStats.totalDepartments,
      icon: <ChartBarIcon className="w-8 h-8" />,
      color: "#8B5CF6",
      bgColor: "bg-purple-50",
      change: "",
    },
    {
      title: "Clinic Email",
      value: clinic?.email || "Not available",
      icon: <UserIcon className="w-8 h-8" />,
      color: "#3B82F6",
      bgColor: "bg-blue-50",
      change: "",
    },
  ];

  const quickActions = [
    {
      title: "Add New Doctor",
      description: "Register a new doctor to your clinic",
      icon: <UserPlusIcon className="w-6 h-6" />,
      color: "#00D09C",
      onClick: () =>
        navigate(`/clinicDashboard/${clinicId}/add-doctor`),
    },
    {
      title: "View All Patients",
      description: "Access complete patient records",
      icon: <UsersIcon className="w-6 h-6" />,
      color: "#3B82F6",
      onClick: () =>
        navigate(`/clinicDashboard/${clinicId}/all-clinic-patients`),
    },
    {
      title: "Doctor Profiles",
      description: "Manage your doctor team",
      icon: <UserGroupIcon className="w-6 h-6" />,
      color: "#8B5CF6",
      onClick: () =>
        navigate(`/clinicDashboard/${clinicId}/all-clinic-doctors`),
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="bg-[#0c213e] px-6 sm:px-8 py-6 sm:py-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
                  Welcome back, {clinic?.clinicName || "Clinic"}
                </h1>
                <div className="flex items-center gap-2 text-gray-300">
                  <ClockIcon className="w-4 h-4" />
                  <p className="text-sm">{dateTime}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Simple header extra row if needed */}
          <div className="px-6 sm:px-8 py-4 bg-gray-50 border-t border-gray-200">
            <p className="text-xs sm:text-sm text-gray-600">
              Manage doctors, departments and patients from one place.
            </p>
          </div>
        </div>

        {/* Stats Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {statsCards.map((card, idx) => (
            <div
              key={idx}
              onMouseEnter={() => setHoveredCard(idx)}
              onMouseLeave={() => setHoveredCard(null)}
              className={`bg-white rounded-xl p-6 shadow-sm border border-gray-100 transition-all duration-300 ${
                hoveredCard === idx ? "shadow-lg scale-105 -translate-y-1" : ""
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div
                  className={`${card.bgColor} p-3 rounded-xl transition-transform duration-300 ${
                    hoveredCard === idx ? "scale-110 rotate-3" : ""
                  }`}
                >
                  <div style={{ color: card.color }}>{card.icon}</div>
                </div>
              </div>
              <h3 className="text-sm font-medium text-gray-600 mb-1">
                {card.title}
              </h3>
              <p className="text-xl sm:text-2xl font-bold text-gray-900 break-all">
                {card.value}
              </p>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Quick Actions</h2>
            <div className="h-1 flex-1 bg-gradient-to-r from-[#0c213e] to-transparent ml-4 rounded-full"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
            {quickActions.map((action, idx) => (
              <button
                key={idx}
                type="button"
                onClick={action.onClick}
                onMouseEnter={() => setHoveredCTA(idx)}
                onMouseLeave={() => setHoveredCTA(null)}
                className={`group relative text-left w-full bg-gradient-to-br from-gray-50 to-white rounded-xl p-6 border-2 border-gray-100 transition-all duration-300 ${
                  hoveredCTA === idx ? "border-[#0c213e] shadow-lg scale-105" : ""
                }`}
              >
                <div
                  className="absolute top-0 left-0 w-full h-1 rounded-t-xl transition-all duration-300"
                  style={{
                    backgroundColor:
                      hoveredCTA === idx ? action.color : "transparent",
                  }}
                ></div>

                <div className="flex items-start gap-4">
                  <div
                    className="p-3 rounded-xl transition-all duration-300"
                    style={{
                      backgroundColor:
                        hoveredCTA === idx ? action.color : "#f3f4f6",
                      color: hoveredCTA === idx ? "white" : action.color,
                    }}
                  >
                    {action.icon}
                  </div>

                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-1 flex items-center justify-between">
                      {action.title}
                      <ArrowRightIcon
                        className={`w-5 h-5 transition-all duration-300 ${
                          hoveredCTA === idx
                            ? "translate-x-1 opacity-100"
                            : "opacity-0"
                        }`}
                        style={{ color: action.color }}
                      />
                    </h3>
                    <p className="text-sm text-gray-600">
                      {action.description}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Single notices section kept, with static text (safe UI copy) */}
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl shadow-sm border border-amber-200 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <span className="text-xl">📌</span>
            Clinic Notices
          </h3>
          <div className="space-y-3">
            {[
              "Review doctor schedules for the coming week.",
              "Verify department information and update if required.",
              "Ensure patient data is backed up regularly.",
            ].map((text, idx) => (
              <div
                key={idx}
                className="flex items-start gap-3 p-3 bg-white rounded-lg shadow-sm transition-all duration-200 hover:shadow-md"
              >
                <div className="w-2 h-2 rounded-full mt-1.5 bg-amber-500"></div>
                <p className="text-sm text-gray-700 flex-1">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClinicHomeDashboard;
