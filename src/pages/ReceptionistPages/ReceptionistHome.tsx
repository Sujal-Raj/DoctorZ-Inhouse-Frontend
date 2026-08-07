// 📁 ReceptionistHome.tsx
import { useEffect, useState, useRef } from "react";
import api from "../../Services/mainApi";
import io from "socket.io-client";
import Swal from "sweetalert2";
import {
  CalendarDays,
  Users,
  Activity,
  Clock,
  // CheckCircle2,
  AlertCircle,
  Stethoscope,
  TrendingUp,
  ChevronRight,
  Wallet,
  RefreshCw,
  Search,
  Hash,
  X,
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
  tokenNumber?: number;
  doctor: { _id: string; fullName: string; specialization: string };
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

function isSameDay(date: Date, ref: Date) {
  const d = new Date(date);
  return (
    d.getDate() === ref.getDate() &&
    d.getMonth() === ref.getMonth() &&
    d.getFullYear() === ref.getFullYear()
  );
}

function toInputDate(d: Date) {
  return d.toISOString().split("T")[0];
}

type DateFilter = "all" | "today" | "tomorrow" | "custom";

// ─── Component ────────────────────────────────────────────────────────────────

export default function ReceptionistHome() {
  const [doctors, setDoctors]       = useState<Doctor[]>([]);
  const [patients, setPatients]     = useState<Patient[]>([]);
  const [totalPatients, setTotalPatients] = useState(0);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState("");

  const [statusFilter, setStatusFilter] = useState("All");
  const [dateFilter, setDateFilter]     = useState<DateFilter>("today");
  const [customDate, setCustomDate]     = useState(toInputDate(new Date()));
  const [search, setSearch]             = useState("");

  const customInputRef = useRef<HTMLInputElement>(null);

  const [incomingNotes, setIncomingNotes] = useState<{ doctorName: string; text: string; time: string }[]>([]);
  const [doctorStatuses, setDoctorStatuses] = useState<Record<string, "active" | "paused" | "blocked">>({});
  const socketRef = useRef<ReturnType<typeof io> | null>(null);

  useEffect(() => {
    const clinicId = localStorage.getItem("clinicId");
    if (!clinicId) return;

    const socketUrl = import.meta.env.VITE_API_BASE || "http://localhost:3000";
    const socket = io(socketUrl, {
      transports: ["websocket"]
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("Receptionist Socket connected:", socket.id);
      socket.emit("joinRoom", "clinic:" + clinicId);
    });

    socket.on("staffNoteReceived", (data: { doctorName: string; text: string }) => {
      const nowTime = new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
      setIncomingNotes((prev) => [
        { doctorName: data.doctorName, text: data.text, time: nowTime },
        ...prev
      ].slice(0, 10));

      Swal.fire({
        toast: true,
        position: "top-end",
        icon: "warning",
        title: `Message from Dr. ${data.doctorName}`,
        text: data.text,
        showConfirmButton: true,
        confirmButtonColor: "#0c213e",
        timer: 10000
      });
    });

    socket.on("queueStatusReceived", (data: { doctorId: string; status: "active" | "paused" | "blocked" }) => {
      setDoctorStatuses((prev) => ({
        ...prev,
        [data.doctorId]: data.status
      }));
    });

    return () => {
      socket.emit("leaveRoom", "clinic:" + clinicId);
      socket.disconnect();
      socketRef.current = null;
    };
  }, []);

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
      // console.log(patRes);
      setTotalPatients(patRes.data.totalPatients ?? 0);
    } catch {
      setError("Failed to load dashboard data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  // ── Derived stats ────────────────────────────────────────────────────────────

  const today     = new Date();
  const tomorrow  = new Date(today); tomorrow.setDate(today.getDate() + 1);

  const todayPatients = patients.filter((p) => isSameDay(p.date, today));
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

  // ── Filtered appointments ────────────────────────────────────────────────────

  const dateFiltered = patients.filter((p) => {
    if (dateFilter === "today")    return isSameDay(p.date, today);
    if (dateFilter === "tomorrow") return isSameDay(p.date, tomorrow);
    if (dateFilter === "custom")   return isSameDay(p.date, new Date(customDate));
    return true; // "all"
  });

  const statusFiltered = dateFiltered.filter(
    (p) => statusFilter === "All" || p.status === statusFilter
  );

  const q = search.trim().toLowerCase();
  const displayed = statusFiltered.filter((item) => {
    if (!q) return true;
    return (
      item.patient?.toLowerCase().includes(q) ||
      item.doctor?.fullName?.toLowerCase().includes(q) ||
      item.doctor?.specialization?.toLowerCase().includes(q) ||
      item.mode?.toLowerCase().includes(q) ||
      item.bookedBy?.toLowerCase().includes(q) ||
      item.status?.toLowerCase().includes(q) ||
      String(item.fees).includes(q) ||
      String(item.tokenNumber ?? "").includes(q) ||
      new Date(item.date).toLocaleDateString().includes(q)
    );
  });

  // ── Time / Date display ───────────────────────────────────────────────────────

  const now     = new Date();
  const timeStr = now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
  const dateStr = now.toLocaleDateString("en-IN", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });

  // ── Date filter label helper ──────────────────────────────────────────────────

  const dateLabel =
    dateFilter === "today"    ? "Today"
    : dateFilter === "tomorrow" ? "Tomorrow"
    : dateFilter === "custom"   ? new Date(customDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
    : "All Dates";

  // ── Loading ───────────────────────────────────────────────────────────────────

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

  // ── Error ─────────────────────────────────────────────────────────────────────

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

  const statusFilters = ["All", "pending", "completed", "cancelled"];

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6 pb-6">

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

      {/* ─── Doctor real-time notifications ticker ─────────────────────────── */}
      {incomingNotes.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-2.5 animate-fadeIn">
          <div className="flex items-center justify-between border-b border-amber-200/50 pb-1.5">
            <span className="text-xs font-bold text-amber-800 uppercase tracking-wider flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 text-amber-600" />
              Live Alerts from consulting rooms ({incomingNotes.length})
            </span>
            <button
              onClick={() => setIncomingNotes([])}
              className="text-[10px] text-amber-700 hover:text-amber-900 font-bold hover:underline cursor-pointer"
            >
              Clear Log
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-40 overflow-y-auto">
            {incomingNotes.map((note, idx) => (
              <div key={idx} className="bg-white border border-amber-100 p-3 rounded-lg shadow-2xs flex justify-between items-start gap-2">
                <div>
                  <span className="font-bold text-xs text-amber-900">Dr. {note.doctorName}</span>
                  <p className="text-xs text-gray-750 mt-1">{note.text}</p>
                </div>
                <span className="text-[10px] text-gray-400 font-medium shrink-0">{note.time}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Full-width Appointments */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">

        {/* Card header */}
        <div className="px-5 py-4 border-b border-gray-100 space-y-3">
          {/* Title row */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-2">
              <CalendarDays className="w-4 h-4" style={{ color: "#0c213e" }} />
              <h2 className="text-base font-semibold" style={{ color: "#0c213e" }}>
                Appointments
              </h2>
              <span
                className="text-xs font-medium px-2 py-0.5 rounded-full"
                style={{ background: "#e8edf4", color: "#0c213e" }}
              >
                {displayed.length} shown
              </span>
            </div>

            {/* Search */}
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Search patient, doctor, token…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-8 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Filters row */}
          <div className="flex flex-wrap items-center gap-2">

            {/* Date filter buttons */}
            <div className="flex gap-1.5 flex-wrap">
              {(["today", "tomorrow", "all"] as DateFilter[]).map((f) => (
                <button
                  key={f}
                  onClick={() => setDateFilter(f)}
                  className="text-xs px-3 py-1.5 rounded-full border transition-all duration-150 font-medium capitalize cursor-pointer"
                  style={
                    dateFilter === f
                      ? { background: "#0c213e", color: "#fff", borderColor: "#0c213e" }
                      : { background: "white", color: "#6b7280", borderColor: "#e5e7eb" }
                  }
                >
                  {f === "all" ? "All Dates" : f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}

              {/* Custom date */}
              <div className="relative">
                <button
                  onClick={() => {
                    setDateFilter("custom");
                    setTimeout(() => customInputRef.current?.showPicker?.(), 50);
                  }}
                  className="text-xs px-3 py-1.5 rounded-full border transition-all duration-150 font-medium flex items-center gap-1"
                  style={
                    dateFilter === "custom"
                      ? { background: "#0c213e", color: "#fff", borderColor: "#0c213e" }
                      : { background: "white", color: "#6b7280", borderColor: "#e5e7eb" }
                  }
                >
                  <CalendarDays className="w-3 h-3" />
                  {dateFilter === "custom"
                    ? new Date(customDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })
                    : "Pick Date"}
                </button>
                <input
                  ref={customInputRef}
                  type="date"
                  value={customDate}
                  onChange={(e) => {
                    setCustomDate(e.target.value);
                    setDateFilter("custom");
                  }}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full"
                  tabIndex={-1}
                />
              </div>
            </div>

            {/* Divider */}
            <div className="w-px h-5 bg-gray-200 hidden sm:block" />

            {/* Status filters */}
            <div className="flex gap-1.5 flex-wrap">
              {statusFilters.map((f) => (
                <button
                  key={f}
                  onClick={() => setStatusFilter(f)}
                  className="text-xs px-3 py-1.5 rounded-full border transition-all duration-150 font-medium capitalize"
                  style={
                    statusFilter === f
                      ? f === "All"
                        ? { background: "#6b7280", color: "#fff", borderColor: "#6b7280" }
                        : f === "completed"
                        ? { background: "#16a34a", color: "#fff", borderColor: "#16a34a" }
                        : f === "pending"
                        ? { background: "#d97706", color: "#fff", borderColor: "#d97706" }
                        : { background: "#dc2626", color: "#fff", borderColor: "#dc2626" }
                      : { background: "white", color: "#6b7280", borderColor: "#e5e7eb" }
                  }
                >
                  {f}
                </button>
              ))}
            </div>

          </div>

          {/* Active filter summary */}
          {(dateFilter !== "all" || statusFilter !== "All" || search) && (
            <div className="flex items-center gap-2 flex-wrap text-xs text-gray-500">
              <span>Showing:</span>
              <span
                className="px-2 py-0.5 rounded-full font-medium"
                style={{ background: "#e8edf4", color: "#0c213e" }}
              >
                {dateLabel}
              </span>
              {statusFilter !== "All" && (
                <span
                  className="px-2 py-0.5 rounded-full font-medium capitalize"
                  style={{ background: "#f3f4f6", color: "#4b5563" }}
                >
                  {statusFilter}
                </span>
              )}
              {search && (
                <span
                  className="px-2 py-0.5 rounded-full font-medium"
                  style={{ background: "#f3f4f6", color: "#4b5563" }}
                >
                  "{search}"
                </span>
              )}
              <button
                onClick={() => { setDateFilter("today"); setStatusFilter("All"); setSearch(""); }}
                className="text-red-400 hover:text-red-600 underline ml-1"
              >
                Clear all
              </button>
            </div>
          )}
        </div>

        {/* Table — desktop */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full min-w-175">
            <thead>
              <tr className="bg-gray-50">
                {["Token", "Patient", "Doctor", "Mode", "Fees", "Status", "Date & Time"].map((h) => (
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
                  <td colSpan={7} className="px-5 py-12 text-center text-sm text-gray-400">
                    No appointments match the selected filters.
                  </td>
                </tr>
              ) : (
                displayed.map((item) => {
                  const sc = getStatus(item.status);
                  return (
                    <tr key={item.bookingId} className="hover:bg-gray-50 transition-colors">

                      {/* Token */}
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-1.5">
                          <Hash className="w-3.5 h-3.5 text-gray-300" />
                          <span
                            className="text-sm font-bold tabular-nums"
                            style={{ color: "#0c213e" }}
                          >
                            {item.tokenNumber ?? "—"}
                          </span>
                        </div>
                      </td>

                      {/* Patient */}
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2.5">
                          <div
                            className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold text-white shrink-0"
                            style={{ background: "#0c213e" }}
                          >
                            {initials(item.patient)}
                          </div>
                          <span className="text-sm font-medium text-gray-800">
                            {item.patient}
                          </span>
                        </div>
                      </td>

                      {/* Doctor */}
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <div>
                            <p className="text-sm text-gray-700 font-medium">{item.doctor?.fullName ?? "—"}</p>
                            <p className="text-xs text-gray-400">{item.doctor?.specialization}</p>
                          </div>
                          {item.doctor && doctorStatuses[item.doctor._id] && doctorStatuses[item.doctor._id] !== "active" && (
                            <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold uppercase border tracking-wider shrink-0 ${
                              doctorStatuses[item.doctor._id] === "paused" ? "bg-amber-50 text-amber-600 border-amber-250 animate-pulse" : "bg-red-50 text-red-600 border-red-250"
                            }`}>
                              {doctorStatuses[item.doctor._id] === "paused" ? "Paused" : "Blocked"}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Mode */}
                      <td className="px-5 py-3 text-sm text-gray-600 capitalize">
                        {item.mode || item.bookedBy || "—"}
                      </td>

                      {/* Fees */}
                      <td className="px-5 py-3 text-sm text-gray-700 font-medium">
                        ₹{item.fees}
                      </td>

                      {/* Status */}
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

                      {/* Date & Time */}
                      <td className="px-5 py-3">
                        <p className="text-sm text-gray-700">
                          {new Date(item.date).toLocaleDateString("en-IN", {
                            day: "numeric", month: "short", year: "numeric",
                          })}
                        </p>
                        <div className="flex items-center gap-1 text-xs text-gray-400 mt-0.5">
                          <Clock className="w-3 h-3" />
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

        {/* Mobile cards */}
        <div className="flex flex-col divide-y divide-gray-100 md:hidden">
          {displayed.length === 0 ? (
            <p className="px-5 py-10 text-center text-sm text-gray-400">
              No appointments match the selected filters.
            </p>
          ) : (
            displayed.map((item) => {
              const sc = getStatus(item.status);
              return (
                <div key={item.bookingId} className="px-5 py-4 space-y-3 hover:bg-gray-50 transition-colors">
                  {/* Top row */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold text-white shrink-0"
                        style={{ background: "#0c213e" }}
                      >
                        {initials(item.patient)}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{item.patient}</p>
                        <div className="flex items-center gap-1 text-xs text-gray-400 mt-0.5">
                          <Hash className="w-3 h-3" />
                          Token: <span className="font-bold text-gray-700 ml-0.5">{item.tokenNumber ?? "—"}</span>
                        </div>
                      </div>
                    </div>
                    <span
                      className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full capitalize shrink-0"
                      style={{ background: sc.bg, color: sc.color }}
                    >
                      <span className="w-1.5 h-1.5 rounded-full" style={{ background: sc.dot }} />
                      {item.status}
                    </span>
                  </div>

                  {/* Doctor */}
                  <div>
                    <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Doctor</p>
                    <p className="text-sm text-gray-700">{item.doctor?.fullName ?? "—"}</p>
                    {item.doctor?.specialization && (
                      <p className="text-xs text-gray-400">{item.doctor.specialization}</p>
                    )}
                  </div>

                  {/* Bottom row */}
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 capitalize">{item.mode || item.bookedBy || "—"}</span>
                    <span className="font-semibold" style={{ color: "#0c213e" }}>₹{item.fees}</span>
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <Clock className="w-3 h-3" />
                      {new Date(item.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                      {" · "}
                      {new Date(item.date).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-400">
          <span>{displayed.length} appointment{displayed.length !== 1 ? "s" : ""} shown</span>
          <button
            onClick={() => { setDateFilter("all"); setStatusFilter("All"); setSearch(""); }}
            className="flex items-center gap-1 hover:underline"
            style={{ color: "#0c213e" }}
          >
            View all <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}