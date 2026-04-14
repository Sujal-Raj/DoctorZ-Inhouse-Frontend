// 📁 ReceptionistHome.tsx
import { useEffect, useState } from "react";
import api from "../../Services/mainApi";
import {
  CalendarDays,
  Users,
  Activity,
  Clock,
  CheckCircle2,
  AlertCircle,
  Stethoscope,
  TrendingUp,
  Bell,
  ChevronRight,
  Wallet,
  RefreshCw,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Doctor {
  _id: string;
  fullName: string;
  specialization?: string;
  experience?: number;
  MobileNo?: string;
  consultationFee?: number;
}

interface Patient {
  bookingId: string;
  doctor: { fullName: string; specialization: string };
  patient: string;
  mode: string;
  bookedBy: string;
  fees: number;
  status: string;
  date: Date;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const statusStyle: Record<string, { bg: string; color: string; dot: string }> = {
  completed: { bg: "#dcfce7", color: "#166534", dot: "#16a34a" },
  pending:   { bg: "#fef3c7", color: "#92400e", dot: "#d97706" },
  cancelled: { bg: "#fee2e2", color: "#991b1b", dot: "#dc2626" },
  default:   { bg: "#f3f4f6", color: "#4b5563", dot: "#9ca3af" },
};

function getStatus(s: string) {
  return statusStyle[s?.toLowerCase()] ?? statusStyle.default;
}

function initials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function isToday(date: Date) {
  const d = new Date(date);
  const now = new Date();
  return (
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear()
  );
}

// ─── Static alerts (UI context only — no API) ─────────────────────────────────

const ALERTS = [
  { id: 1, text: "Remember to confirm tomorrow's appointments", type: "info" },
  { id: 2, text: "2 patients are currently waiting", type: "warning" },
  { id: 3, text: "All morning slots are fully booked", type: "success" },
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function ReceptionistHome() {
  const [doctors, setDoctors]     = useState<Doctor[]>([]);
  const [patients, setPatients]   = useState<Patient[]>([]);
  const [totalPatients, setTotalPatients] = useState(0);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const fetchAll = async () => {
    setLoading(true);
    setError("");
    try {
      const token    = localStorage.getItem("receptionToken");
      const clinicId = localStorage.getItem("clinicId");

      const [docRes, patRes] = await Promise.all([
        api.get("/api/receptionist/getClinicDoctorsForReceptionist", {
          headers: { Authorization: `Bearer ${token}` },
          params: { clinicId },
        }),
        api.get("/api/receptionist/clinic-patients", {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      setDoctors(docRes.data.doctors ?? []);
      setPatients(patRes.data.patients ?? []);
      setTotalPatients(patRes.data.totalPatients ?? 0);
    } catch {
      setError("Failed to load dashboard data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  // ── Derived stats ────────────────────────────────────────────────────────────

  const todayPatients = patients.filter((p) => isToday(p.date));
  const completed     = todayPatients.filter((p) => p.status === "completed").length;
  const pending       = todayPatients.filter((p) => p.status === "pending").length;
  const revenueToday  = todayPatients.reduce((s, p) => s + (p.fees ?? 0), 0);

  const STATS = [
    {
      title: "Total Patients",
      value: totalPatients,
      sub: `${todayPatients.length} today`,
      icon: Users,
      accent: "#0c213e",
      bg: "#e8edf4",
    },
    {
      title: "Total Doctors",
      value: doctors.length,
      sub: "in your clinic",
      icon: Stethoscope,
      accent: "#1a6b4a",
      bg: "#e6f4ef",
    },
    {
      title: "Today's Bookings",
      value: todayPatients.length,
      sub: `${pending} pending`,
      icon: Activity,
      accent: "#b45309",
      bg: "#fef3e2",
    },
    {
      title: "Today's Revenue",
      value: `₹${revenueToday.toLocaleString("en-IN")}`,
      sub: `${completed} completed`,
      icon: Wallet,
      accent: "#7c3aed",
      bg: "#f3effe",
    },
  ];

  const filters   = ["All", "pending", "completed", "cancelled"];
  const displayed = todayPatients.filter(
    (p) => statusFilter === "All" || p.status === statusFilter
  );

  const now     = new Date();
  const timeStr = now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
  const dateStr = now.toLocaleDateString("en-IN", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });

  // ── Loading state ─────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <div
            className="w-8 h-8 rounded-full border-2 animate-spin"
            style={{ borderColor: "#0c213e", borderTopColor: "transparent" }}
          />
          <p className="text-sm text-gray-500">Loading dashboard…</p>
        </div>
      </div>
    );
  }

  // ── Error state ───────────────────────────────────────────────────────────────

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3 text-center">
          <AlertCircle className="w-8 h-8 text-red-400" />
          <p className="text-sm text-gray-600">{error}</p>
          <button
            onClick={fetchAll}
            className="flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
            style={{ color: "#0c213e" }}
          >
            <RefreshCw className="w-4 h-4" /> Retry
          </button>
        </div>
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6 pb-4">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "#0c213e" }}>
            Good Morning, Reception
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {dateStr} · {timeStr}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span
            className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full"
            style={{ background: "#e6f4ef", color: "#1a6b4a" }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
            Clinic Open
          </span>
          <button
            onClick={fetchAll}
            className="p-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 transition-colors"
            title="Refresh dashboard"
          >
            <RefreshCw className="w-4 h-4" style={{ color: "#0c213e" }} />
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {STATS.map((item, i) => {
          const Icon = item.icon;
          return (
            <div
              key={i}
              className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-all duration-200"
            >
              <div className="flex items-start justify-between mb-3">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center"
                  style={{ background: item.bg }}
                >
                  <Icon className="w-5 h-5" style={{ color: item.accent }} />
                </div>
                <TrendingUp className="w-4 h-4 text-green-400" />
              </div>
              <p className="text-sm text-gray-500 mb-1">{item.title}</p>
              <p className="text-3xl font-bold" style={{ color: "#0c213e" }}>
                {item.value}
              </p>
              <p className="text-xs mt-1" style={{ color: item.accent }}>
                {item.sub}
              </p>
            </div>
          );
        })}
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">

        {/* Today's Appointments table — 2/3 width */}
        <div className="xl:col-span-2 bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-5 py-4 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <CalendarDays className="w-4 h-4" style={{ color: "#0c213e" }} />
              <h2 className="text-base font-semibold" style={{ color: "#0c213e" }}>
                Today's Appointments
              </h2>
              <span
                className="text-xs font-medium px-2 py-0.5 rounded-full"
                style={{ background: "#e8edf4", color: "#0c213e" }}
              >
                {todayPatients.length}
              </span>
            </div>
            <div className="flex gap-1.5 flex-wrap">
              {filters.map((f) => (
                <button
                  key={f}
                  onClick={() => setStatusFilter(f)}
                  className="text-xs px-3 py-1 rounded-full border transition-all duration-150 font-medium capitalize"
                  style={
                    statusFilter === f
                      ? { background: "#0c213e", color: "#fff", borderColor: "#0c213e" }
                      : { background: "white", color: "#6b7280", borderColor: "#e5e7eb" }
                  }
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px]">
              <thead>
                <tr className="bg-gray-50">
                  {["Patient", "Doctor", "Mode", "Fees", "Status", "Time"].map((h) => (
                    <th
                      key={h}
                      className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide px-5 py-3"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {displayed.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-10 text-center text-sm text-gray-400">
                      {todayPatients.length === 0
                        ? "No appointments scheduled for today."
                        : "No appointments match this filter."}
                    </td>
                  </tr>
                ) : (
                  displayed.map((item) => {
                    const sc = getStatus(item.status);
                    return (
                      <tr key={item.bookingId} className="hover:bg-gray-50 transition-colors">
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-2.5">
                            <div
                              className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold text-white flex-shrink-0"
                              style={{ background: "#0c213e" }}
                            >
                              {initials(item.patient)}
                            </div>
                            <span className="text-sm font-medium text-gray-800">
                              {item.patient}
                            </span>
                          </div>
                        </td>
                        <td className="px-5 py-3">
                          <p className="text-sm text-gray-700">{item.doctor?.fullName ?? "—"}</p>
                          <p className="text-xs text-gray-400">{item.doctor?.specialization}</p>
                        </td>
                        <td className="px-5 py-3 text-sm text-gray-600 capitalize">
                          {item.mode || item.bookedBy || "—"}
                        </td>
                        <td className="px-5 py-3 text-sm text-gray-700">
                          ₹{item.fees}
                        </td>
                        <td className="px-5 py-3">
                          <span
                            className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full capitalize"
                            style={{ background: sc.bg, color: sc.color }}
                          >
                            <span
                              className="w-1.5 h-1.5 rounded-full"
                              style={{ background: sc.dot }}
                            />
                            {item.status}
                          </span>
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-1.5 text-sm text-gray-600">
                            <Clock className="w-3.5 h-3.5 text-gray-400" />
                            {new Date(item.date).toLocaleTimeString("en-IN", {
                              hour: "2-digit", minute: "2-digit",
                            })}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="px-5 py-3 border-t border-gray-100 flex justify-end">
            <button
              className="text-xs font-medium flex items-center gap-1 hover:underline"
              style={{ color: "#0c213e" }}
            >
              View all patients <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Right column */}
        <div className="flex flex-col gap-4">

          {/* Clinic Doctors */}
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-100">
              <Stethoscope className="w-4 h-4" style={{ color: "#0c213e" }} />
              <h2 className="text-base font-semibold" style={{ color: "#0c213e" }}>
                Clinic Doctors
              </h2>
              <span
                className="text-xs font-medium px-2 py-0.5 rounded-full ml-auto"
                style={{ background: "#e8edf4", color: "#0c213e" }}
              >
                {doctors.length}
              </span>
            </div>
            <div className="divide-y divide-gray-50 max-h-64 overflow-y-auto">
              {doctors.length === 0 ? (
                <p className="px-5 py-6 text-sm text-gray-400">No doctors found.</p>
              ) : (
                doctors.map((doc) => (
                  <div
                    key={doc._id}
                    className="flex items-center justify-between px-5 py-3 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold text-white flex-shrink-0"
                        style={{ background: "#0c213e" }}
                      >
                        {initials(doc.fullName)}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-800">{doc.fullName}</p>
                        <p className="text-xs text-gray-400">
                          {doc.specialization ?? "General"}
                        </p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      {doc.consultationFee ? (
                        <p className="text-xs font-semibold" style={{ color: "#0c213e" }}>
                          ₹{doc.consultationFee}
                        </p>
                      ) : null}
                      {doc.experience ? (
                        <p className="text-xs text-gray-400">{doc.experience} yrs</p>
                      ) : null}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Alerts — static, UI context only */}
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4" style={{ color: "#0c213e" }} />
                <h2 className="text-base font-semibold" style={{ color: "#0c213e" }}>
                  Alerts
                </h2>
              </div>
              <span
                className="text-xs font-medium px-2 py-0.5 rounded-full"
                style={{ background: "#fee2e2", color: "#991b1b" }}
              >
                {ALERTS.length} new
              </span>
            </div>
            <div className="divide-y divide-gray-50">
              {ALERTS.map((n) => {
                const cfg =
                  n.type === "success"
                    ? { Icon: CheckCircle2, color: "#16a34a", bg: "#e6f4ef" }
                    : n.type === "warning"
                    ? { Icon: AlertCircle,  color: "#d97706", bg: "#fef3c7" }
                    : { Icon: Bell,         color: "#2563eb", bg: "#dbeafe" };
                return (
                  <div key={n.id} className="flex gap-3 px-5 py-3 hover:bg-gray-50 transition-colors">
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                      style={{ background: cfg.bg }}
                    >
                      <cfg.Icon className="w-3.5 h-3.5" style={{ color: cfg.color }} />
                    </div>
                    <p className="text-sm text-gray-700 leading-snug">{n.text}</p>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      </div>

      {/* Summary bar */}
      {/* <div
        className="rounded-xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
        style={{ background: "#0c213e" }}
      > */}
        {/* <div>
          <p className="text-white font-semibold text-base">Today's Summary</p>
          <p className="text-xs mt-0.5" style={{ color: "#93aabf" }}>
            {dateStr}
          </p>
        </div>
        <div className="flex flex-wrap gap-6">
          {[
            { label: "Total Bookings", value: todayPatients.length,                              icon: CalendarDays,  color: "#60a5fa" },
            { label: "Completed",      value: completed,                                          icon: CheckCircle2, color: "#4ade80" },
            { label: "Pending",        value: pending,                                            icon: Clock,        color: "#fbbf24" },
            { label: "Revenue",        value: `₹${revenueToday.toLocaleString("en-IN")}`,         icon: Wallet,       color: "#c084fc" },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.label} className="flex items-center gap-2">
                <Icon className="w-4 h-4" style={{ color: item.color }} />
                <div>
                  <p className="text-lg font-bold leading-none" style={{ color: item.color }}>
                    {item.value}
                  </p>
                  <p className="text-xs" style={{ color: "#93aabf" }}>
                    {item.label}
                  </p>
                </div>
              </div>
            );
          })}
        </div> */}
      
      {/* </div> */}

    </div>
  );
}