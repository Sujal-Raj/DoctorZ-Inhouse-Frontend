import { useEffect, useState, useMemo, useRef } from "react";
import { 
  Search, Users, CheckCircle, Clock, AlertCircle,
  ArrowRight, RefreshCw, Check, Video, MapPin, Hash, IndianRupee,
  Play, Pause, Power, Printer, Lock
} from "lucide-react";
import api from "../../Services/mainApi";
import { useLocation, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import io from "socket.io-client";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Patient {
  name: string;
  age: number;
  gender: string;
  contact: string | number;
  aadhar?: string;
}

interface OnlineBooking {
  _id: string;
  patient: Patient;
  dateTime: string;
  fees: number;
  mode: "online" | "offline";
  status: string;
  clinicId?: any;
}

interface OfflineUser {
  fullName?: string;
  dob?: string;
  gender?: string;
  mobileNumber?: string;
  aadhar?: string;
}

interface OfflinePatientData {
  name?: string;
  age?: number;
  gender?: "Male" | "Female" | "Other";
  aadhar?: string;
  contact?: string;
}

interface OfflineBooking {
  _id: string;
  userId?: OfflineUser;
  patient?: OfflinePatientData;
  bookedBy?: string;
  date: string;          // "YYYY-MM-DD"
  tokenNumber: number;
  fees: number;
  status: string;
  paid: boolean;
  clinicId?: any;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const getWeekBounds = () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay() + 1); // Monday
  startOfWeek.setHours(0, 0, 0, 0);

  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6); // Sunday
  endOfWeek.setHours(23, 59, 59, 999);

  return { today, startOfWeek, endOfWeek };
};

const sortByDate = <T,>(list: T[], getDate: (item: T) => Date) =>
  [...list].sort((a, b) => getDate(a).getTime() - getDate(b).getTime());

const PRESCRIBED_BOOKING_KEY = "doctorPrescribedBookingIds";

const getPrescribedBookingIds = () => {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(PRESCRIBED_BOOKING_KEY);
    return stored ? (JSON.parse(stored) as string[]) : [];
  } catch {
    return [];
  }
};

const savePrescribedBookingIds = (ids: string[]) => {
  if (typeof window === "undefined") return;
  localStorage.setItem(PRESCRIBED_BOOKING_KEY, JSON.stringify(ids));
};

// ─── Status badge ─────────────────────────────────────────────────────────────

const StatusBadge = ({ status }: { status: string }) => {
  const styles: Record<string, string> = {
    pending: "bg-amber-50 text-amber-700 border-amber-250",
    completed: "bg-emerald-50 text-emerald-700 border-emerald-250",
    cancelled: "bg-red-50 text-red-700 border-red-250",
    waiting: "bg-blue-50 text-blue-700 border-blue-250",
    "in-consultation": "bg-purple-50 text-purple-700 border-purple-250",
    registered: "bg-gray-50 text-gray-700 border-gray-250"
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide border ${styles[status] ?? "bg-gray-50 text-gray-700 border-gray-250"}`}>
      {status}
    </span>
  );
};

export default function DoctorAppointments() {
  const [onlineBookings, setOnlineBookings] = useState<OnlineBooking[]>([]);
  const [offlineBookings, setOfflineBookings] = useState<OfflineBooking[]>([]);
  const [activeTab, setActiveTab] = useState<"online" | "offline">("offline");
  const [loading, setLoading] = useState(true);
  const [completingId, setCompletingId] = useState<string | null>(null);
  const [prescribedIds, setPrescribedIds] = useState<string[]>(() => getPrescribedBookingIds());
  
  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [queueSubTab, setQueueSubTab] = useState<"active" | "upcoming" | "history">("active");
  const [clinicId, setClinicId] = useState<string | null>(null);
  const socketRef = useRef<ReturnType<typeof io> | null>(null);
  
  // Doctor Queue Block Status
  const [queueStatus, setQueueStatus] = useState<"active" | "paused" | "blocked">(() => {
    return (localStorage.getItem("doctorQueueStatus") as any) || "active";
  });

  const doctorId = localStorage.getItem("doctorId");
  const navigate = useNavigate();
  const location = useLocation();

  // ─── Fetch ──────────────────────────────────────────────────────────────────

  const fetchOnlineBookings = async () => {
    if (!doctorId) return;
    try {
      const { data } = await api.get<{ bookings: OnlineBooking[] }>(
        `/api/booking/doctor/${doctorId}`
      );
      
      if (data.bookings?.length > 0) {
        const firstWithClinic = data.bookings.find((b: any) => b.clinicId);
        if (firstWithClinic && firstWithClinic.clinicId) {
          setClinicId(typeof firstWithClinic.clinicId === "string" ? firstWithClinic.clinicId : firstWithClinic.clinicId._id || firstWithClinic.clinicId);
        }

        const { today, startOfWeek, endOfWeek } = getWeekBounds();

        const todayList = data.bookings.filter(
          (b) => b.dateTime && new Date(b.dateTime).toDateString() === today.toDateString()
        );
        const weekList = data.bookings.filter((b) => {
          if (!b.dateTime) return false;
          const d = new Date(b.dateTime);
          return d.toDateString() !== today.toDateString() && d >= startOfWeek && d <= endOfWeek;
        });
        const upcomingList = data.bookings.filter(
          (b) => b.dateTime && new Date(b.dateTime) > endOfWeek
        );

        const getD = (b: OnlineBooking) => new Date(b.dateTime);
        setOnlineBookings([
          ...sortByDate(todayList, getD),
          ...sortByDate(weekList, getD),
          ...sortByDate(upcomingList, getD),
        ]);
      } else {
        setOnlineBookings([]);
      }
    } catch (err) {
      console.error("Failed to fetch online bookings:", err);
      setOnlineBookings([]);
    }
  };

  const fetchOfflineBookings = async () => {
    if (!doctorId) return;
    try {
      const { data } = await api.get<{ bookings: OfflineBooking[] }>(
        `/api/bookOffline/doctor/${doctorId}`
      );
      if (data.bookings?.length > 0) {
        const firstWithClinic = data.bookings.find((b: any) => b.clinicId);
        if (firstWithClinic && firstWithClinic.clinicId) {
          setClinicId(typeof firstWithClinic.clinicId === "string" ? firstWithClinic.clinicId : firstWithClinic.clinicId._id || firstWithClinic.clinicId);
        }

        setOfflineBookings(
          sortByDate(data.bookings, (b) => new Date(b.date))
        );
      } else {
        setOfflineBookings([]);
      }
    } catch (err) {
      console.error("Failed to fetch offline bookings:", err);
      setOfflineBookings([]);
    }
  };

  const fetchAll = async () => {
    setLoading(true);
    await Promise.all([fetchOnlineBookings(), fetchOfflineBookings()]);
    setLoading(false);
  };

  useEffect(() => {
    fetchAll();
  }, []);

  useEffect(() => {
    const incomingId = (location.state as { prescribedBookingId?: string } | null)?.prescribedBookingId;
    if (!incomingId) return;

    setPrescribedIds((prev) => {
      if (prev.includes(incomingId)) return prev;
      const next = [...prev, incomingId];
      savePrescribedBookingIds(next);
      return next;
    });
  }, [location.state]);

  // ─── Status updates ─────────────────────────────────────────────────────────

  const completeOnline = async (id: string) => {
    try {
      setCompletingId(id);
      await api.put(`/api/booking/${id}/status`, { status: "completed" });
      fetchOnlineBookings();
      Swal.fire({
        title: "Appointment Completed",
        text: "Online consulting record has been successfully closed.",
        icon: "success",
        timer: 1500,
        showConfirmButton: false
      });
    } catch (err) {
      console.error("Failed to update online status:", err);
    } finally {
      setCompletingId(null);
    }
  };

  const completeOffline = async (id: string) => {
    try {
      setCompletingId(id);
      await api.put(`/api/bookOffline/${id}/status`, { status: "completed" });
      fetchOfflineBookings();
      Swal.fire({
        title: "Appointment Completed",
        text: "Walk-in registration slot has been successfully completed.",
        icon: "success",
        timer: 1500,
        showConfirmButton: false
      });
    } catch (err) {
      console.error("Failed to update offline status:", err);
    } finally {
      setCompletingId(null);
    }
  };

  const toggleQueueStatus = (status: "active" | "paused" | "blocked") => {
    setQueueStatus(status);
    localStorage.setItem("doctorQueueStatus", status);

    if (socketRef.current && clinicId) {
      socketRef.current.emit("doctorQueueUpdate", {
        roomId: "clinic:" + clinicId,
        status,
        doctorId: doctorId || ""
      });
    }
    
    let message = "Your clinic queue status is now Active.";
    if (status === "paused") {
      message = "Clinic queue has been paused. Reception desk notified.";
    } else if (status === "blocked") {
      message = "Appointments for the rest of today have been blocked.";
    }

    Swal.fire({
      title: "Queue Status Updated",
      text: message,
      icon: "info",
      confirmButtonColor: "#0c213e"
    });
  };

  // Socket connection hook
  useEffect(() => {
    if (!clinicId) return;
    const socketUrl = import.meta.env.VITE_API_BASE || "http://localhost:3000";
    const socket = io(socketUrl, {
      transports: ["websocket"]
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("Socket connected for Queue Controls:", socket.id);
      socket.emit("joinRoom", "clinic:" + clinicId);

      // Emit status on connection
      socket.emit("doctorQueueUpdate", {
        roomId: "clinic:" + clinicId,
        status: queueStatus,
        doctorId: doctorId || ""
      });
    });

    return () => {
      socket.emit("leaveRoom", "clinic:" + clinicId);
      socket.disconnect();
      socketRef.current = null;
    };
  }, [clinicId, queueStatus]);

  // Date helper methods
  const isDateToday = (dateStr: string | Date) => {
    const d = new Date(dateStr);
    const today = new Date();
    return d.getDate() === today.getDate() &&
           d.getMonth() === today.getMonth() &&
           d.getFullYear() === today.getFullYear();
  };

  const isDateFuture = (dateStr: string | Date) => {
    const d = new Date(dateStr);
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    return d > today;
  };

  // ─── Search filtering ────────────────────────────────────────────────────────
  const filteredOnlineBookings = useMemo(() => {
    if (!searchTerm.trim()) return onlineBookings;
    const term = searchTerm.toLowerCase();
    return onlineBookings.filter((b) => 
      b.patient?.name?.toLowerCase().includes(term) ||
      String(b.patient?.contact).includes(term)
    );
  }, [onlineBookings, searchTerm]);

  const filteredOfflineBookings = useMemo(() => {
    if (!searchTerm.trim()) return offlineBookings;
    const term = searchTerm.toLowerCase();
    return offlineBookings.filter((b) => {
      const name = b.userId?.fullName || b.patient?.name || "";
      const phone = b.userId?.mobileNumber || b.patient?.contact || "";
      return name.toLowerCase().includes(term) || String(phone).includes(term);
    });
  }, [offlineBookings, searchTerm]);

  // Sub-tab categorized filters
  const displayedOfflineBookings = useMemo(() => {
    return filteredOfflineBookings.filter((b) => {
      const isToday = b.date ? isDateToday(b.date) : false;
      const isFuture = b.date ? isDateFuture(b.date) : false;
      const isPastOrDone = (!isToday && !isFuture) || b.status === "completed" || b.status === "cancelled";

      if (queueSubTab === "active") {
        return isToday && b.status !== "completed" && b.status !== "cancelled";
      } else if (queueSubTab === "upcoming") {
        return isFuture && b.status !== "completed" && b.status !== "cancelled";
      } else {
        return isPastOrDone;
      }
    });
  }, [filteredOfflineBookings, queueSubTab]);

  const displayedOnlineBookings = useMemo(() => {
    return filteredOnlineBookings.filter((b) => {
      const isToday = b.dateTime ? isDateToday(b.dateTime) : false;
      const isFuture = b.dateTime ? isDateFuture(b.dateTime) : false;
      const isPastOrDone = (!isToday && !isFuture) || b.status === "completed" || b.status === "cancelled";

      if (queueSubTab === "active") {
        return isToday && b.status !== "completed" && b.status !== "cancelled";
      } else if (queueSubTab === "upcoming") {
        return isFuture && b.status !== "completed" && b.status !== "cancelled";
      } else {
        return isPastOrDone;
      }
    });
  }, [filteredOnlineBookings, queueSubTab]);

  // ─── Grouping bookings ─────────────────────────────────────────────
  // Totals for Dashboard Cards
  const totals = useMemo(() => {
    const activeOffline = offlineBookings.filter(b => b.status === "pending" || b.status === "waiting" || b.status === "in-consultation");
    const activeOnline = onlineBookings.filter(b => b.status === "pending");
    
    const completedOffline = offlineBookings.filter(b => b.status === "completed").length;
    const completedOnline = onlineBookings.filter(b => b.status === "completed").length;

    return {
      waitingWalkins: activeOffline.length,
      waitingOnline: activeOnline.length,
      completedToday: completedOffline + completedOnline,
      totalActive: activeOffline.length + activeOnline.length
    };
  }, [offlineBookings, onlineBookings]);

  if (loading) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-[400px]">
        <RefreshCw className="w-10 h-10 text-[#0c213e] animate-spin mb-4" />
        <p className="text-gray-500 font-medium">Reconciling doctor appointment queues...</p>
      </div>
    );
  }

  return (
    <div className="w-full p-6 space-y-6 font-[Poppins]">
      
      {/* ─── Header & Queue status ─────────────────────────────────────────── */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 bg-white p-6 rounded-2xl border border-gray-200 shadow-xs">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Patient Appointments</h1>
          <p className="text-sm text-gray-500 mt-1">Review, sort, and consult walk-ins and video schedules.</p>
        </div>

        {/* Quick actions for queue control */}
        <div className="flex flex-wrap items-center gap-3 bg-gray-50 p-2 rounded-xl border border-gray-150">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider px-2">Queue Controls:</span>
          
          <button
            onClick={() => toggleQueueStatus("active")}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${queueStatus === "active" ? "bg-[#0c213e] text-white shadow-xs" : "text-gray-600 hover:bg-gray-100"}`}
          >
            <Play className="w-3.5 h-3.5" /> Active
          </button>
          
          <button
            onClick={() => toggleQueueStatus("paused")}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${queueStatus === "paused" ? "bg-amber-600 text-white shadow-xs" : "text-gray-600 hover:bg-gray-100"}`}
          >
            <Pause className="w-3.5 h-3.5" /> Pause (Emergency)
          </button>

          <button
            onClick={() => toggleQueueStatus("blocked")}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${queueStatus === "blocked" ? "bg-red-600 text-white shadow-xs" : "text-gray-600 hover:bg-gray-100"}`}
          >
            <Power className="w-3.5 h-3.5" /> Block Rest of Day
          </button>
        </div>
      </div>

      {/* ─── Vitals Stats Cards ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Total Active Queue */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5 flex items-center gap-4 shadow-xs">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center shrink-0 animate-pulse">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <span className="text-gray-400 text-xs font-semibold uppercase tracking-wider block">Total Active Queue</span>
            <h3 className="text-2xl font-bold text-gray-900 mt-0.5">{totals.totalActive}</h3>
          </div>
        </div>

        {/* Walk-in Waiting */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5 flex items-center gap-4 shadow-xs">
          <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center shrink-0">
            <MapPin className="w-6 h-6" />
          </div>
          <div>
            <span className="text-gray-400 text-xs font-semibold uppercase tracking-wider block">Walk-in Waiting</span>
            <h3 className="text-2xl font-bold text-gray-900 mt-0.5">{totals.waitingWalkins}</h3>
          </div>
        </div>

        {/* Online Consulting */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5 flex items-center gap-4 shadow-xs">
          <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center shrink-0">
            <Video className="w-6 h-6" />
          </div>
          <div>
            <span className="text-gray-400 text-xs font-semibold uppercase tracking-wider block">Online Consulting</span>
            <h3 className="text-2xl font-bold text-gray-900 mt-0.5">{totals.waitingOnline}</h3>
          </div>
        </div>

        {/* Consultations Done */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5 flex items-center gap-4 shadow-xs">
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center shrink-0">
            <CheckCircle className="w-6 h-6" />
          </div>
          <div>
            <span className="text-gray-400 text-xs font-semibold uppercase tracking-wider block">Consultations Done</span>
            <h3 className="text-2xl font-bold text-gray-900 mt-0.5">{totals.completedToday}</h3>
          </div>
        </div>

      </div>

      {/* ─── Search & Tab Switcher Controls ─────────────────────────────────── */}
      <div className="bg-white p-5 border border-gray-200 rounded-2xl shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Tab switchers */}
        <div className="flex gap-2 p-1 bg-gray-100 rounded-xl border border-gray-200 w-full md:w-auto">
          <button
            onClick={() => setActiveTab("offline")}
            className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-xs font-bold transition-all uppercase tracking-wide cursor-pointer ${
              activeTab === "offline" ? "bg-[#0c213e] text-white shadow-xs" : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <MapPin className="w-4 h-4" />
            Walk-in Patients
          </button>
          <button
            onClick={() => setActiveTab("online")}
            className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-xs font-bold transition-all uppercase tracking-wide cursor-pointer ${
              activeTab === "online" ? "bg-[#0c213e] text-white shadow-xs" : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <Video className="w-4 h-4" />
            Online Teleconsults
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-gray-400" />
          <input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search patient name / contact..."
            className="w-full border border-gray-300 rounded-xl pl-10 pr-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition bg-white"
          />
        </div>

      </div>

      {/* ─── Queue Sub-Tab Filters ─────────────────────────────────────────── */}
      <div className="flex border-b border-gray-250 bg-white p-2 rounded-2xl border border-gray-250/80 shadow-xs gap-1">
        <button
          type="button"
          onClick={() => setQueueSubTab("active")}
          className={`flex-1 sm:flex-none px-6 py-2.5 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all cursor-pointer ${
            queueSubTab === "active" ? "bg-blue-600 text-white shadow-sm" : "text-gray-500 hover:text-gray-800 hover:bg-gray-50"
          }`}
        >
          Active Queue (Today)
        </button>
        <button
          type="button"
          onClick={() => setQueueSubTab("upcoming")}
          className={`flex-1 sm:flex-none px-6 py-2.5 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all cursor-pointer ${
            queueSubTab === "upcoming" ? "bg-blue-600 text-white shadow-sm" : "text-gray-500 hover:text-gray-800 hover:bg-gray-50"
          }`}
        >
          Upcoming Schedules
        </button>
        <button
          type="button"
          onClick={() => setQueueSubTab("history")}
          className={`flex-1 sm:flex-none px-6 py-2.5 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all cursor-pointer ${
            queueSubTab === "history" ? "bg-blue-600 text-white shadow-sm" : "text-gray-500 hover:text-gray-800 hover:bg-gray-50"
          }`}
        >
          Past & Completed History
        </button>
      </div>

      {/* Warning banner for Emergency Mode */}
      {queueStatus !== "active" && (
        <div className={`p-4 rounded-xl border ${queueStatus === "paused" ? "bg-amber-50 text-amber-800 border-amber-200" : "bg-red-50 text-red-800 border-red-200"} flex items-center gap-3 animate-pulse`}>
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <div className="text-xs font-semibold">
            {queueStatus === "paused" 
              ? "EMERGENCY: Queue operations are temporarily paused. Real-time patient check-ins are on hold."
              : "BLOCKED: Intake for today has been closed. No further walk-ins or bookings can join the active queue."}
          </div>
        </div>
      )}

      {/* ─── High Density Queue Registry Data Table ─────────────────────────── */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-xs overflow-hidden">
        
        {activeTab === "offline" ? (
          displayedOfflineBookings.length === 0 ? (
            <div className="text-center py-20 text-gray-400">
              <MapPin className="w-12 h-12 mx-auto text-gray-300 stroke-[1.2] mb-3" />
              <h4 className="text-base font-bold text-gray-800">No Walk-in Queue Listings</h4>
              <p className="text-xs text-gray-400 mt-1">Check-in details matching filter criteria will show here.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-[#0c213e] text-white text-xs font-bold uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-4">Token & Entry</th>
                    <th className="px-6 py-4">Patient Profile</th>
                    <th className="px-6 py-4">Consultation Fee</th>
                    <th className="px-6 py-4">Visit Date</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-150 text-sm text-gray-700">
                  {displayedOfflineBookings.map((b) => {
                    const patientName = b.userId?.fullName || b.patient?.name || "Walk-in Patient";
                    const patientGender = b.userId?.gender || b.patient?.gender || "Unknown";
                    const patientPhone = b.userId?.mobileNumber || b.patient?.contact || "No Contact";
                    const patientAadhar = b.userId?.aadhar || b.patient?.aadhar || "";
                    const prescribed = prescribedIds.includes(b._id);

                    const ageVal = b.userId?.dob 
                      ? `${new Date().getFullYear() - new Date(b.userId.dob).getFullYear()} Yrs` 
                      : b.patient?.age ? `${b.patient.age} Yrs` : "N/A";

                    return (
                      <tr key={b._id} className="hover:bg-gray-50/50 transition">
                        
                        {/* Token */}
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center gap-1 bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold px-2.5 py-1 rounded-lg">
                            <Hash className="w-3.5 h-3.5 text-amber-500" />
                            Token #{b.tokenNumber}
                          </span>
                        </td>

                        {/* Profile Info */}
                        <td className="px-6 py-4">
                          <div>
                            <span className="font-bold text-gray-900 block capitalize">{patientName}</span>
                            <span className="text-xs text-gray-500 mt-0.5 block">
                              {ageVal} • {patientGender}
                            </span>
                            <span className="text-xs text-gray-400 block mt-0.5">
                              📞 {patientPhone} {patientAadhar && `| Aadhar: ${patientAadhar}`}
                            </span>
                          </div>
                        </td>

                        {/* Fee details */}
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-1">
                            <span className="font-bold text-gray-900 flex items-center gap-0.5">
                              <IndianRupee size={13} className="text-gray-400" />
                              {b.fees}
                            </span>
                            <span className={`inline-flex items-center text-[9px] w-fit font-extrabold uppercase px-1.5 py-0.2 rounded border ${b.paid ? "bg-green-50 text-green-700 border-green-200" : "bg-red-50 text-red-700 border-red-200"}`}>
                              {b.paid ? "Paid" : "Unpaid"}
                            </span>
                          </div>
                        </td>

                        {/* Date */}
                        <td className="px-6 py-4 text-xs font-medium text-gray-500">
                          {b.date ? new Date(b.date).toLocaleDateString("en-IN", {
                            day: "2-digit", month: "short", year: "numeric"
                          }) : "—"}
                        </td>

                        {/* Status */}
                        <td className="px-6 py-4">
                          <StatusBadge status={b.status} />
                        </td>

                        {/* Action parameters */}
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center gap-2">
                            
                            {b.status === "completed" ? (
                              prescribed ? (
                                <button
                                  onClick={() => 
                                    navigate(
                                      `/doctordashboard/${doctorId}/appointments/addPrescription/${b._id}/${patientAadhar}`,
                                      { state: { name: patientName, gender: patientGender, mobileNumber: patientPhone } }
                                    )
                                  }
                                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold transition cursor-pointer"
                                >
                                  <Printer size={13} className="text-emerald-600" /> View / Print Rx
                                </button>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-gray-50 border border-gray-200 text-gray-400 rounded-xl text-xs font-bold">
                                  <Lock size={12} className="text-gray-400" /> Closed
                                </span>
                              )
                            ) : (
                              <>
                                {b.status === "pending" && (
                                  <button
                                    onClick={() => completeOffline(b._id)}
                                    disabled={completingId === b._id}
                                    className="inline-flex items-center gap-1 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 disabled:bg-gray-100 text-emerald-700 border border-emerald-250 rounded-xl text-xs font-bold transition cursor-pointer"
                                    title="Mark Completed"
                                  >
                                    <Check className="w-3.5 h-3.5" />
                                    {completingId === b._id ? "..." : "Complete"}
                                  </button>
                                )}

                                <button
                                  onClick={() => 
                                    navigate(
                                      `/doctordashboard/${doctorId}/appointments/addPrescription/${b._id}/${patientAadhar}`,
                                      { state: { name: patientName, gender: patientGender, mobileNumber: patientPhone } }
                                    )
                                  }
                                  className={`inline-flex items-center gap-1 px-4 py-2 rounded-xl text-xs font-bold border transition cursor-pointer ${prescribed ? "bg-gray-100 text-gray-400 border-gray-250" : "bg-[#0c213e] hover:bg-blue-900 text-white border-[#0c213e]"}`}
                                >
                                  {prescribed ? (
                                    <>
                                      <CheckCircle size={14} className="text-emerald-500" /> Prescribed
                                    </>
                                  ) : (
                                    <>
                                      Consult <ArrowRight size={14} />
                                    </>
                                  )}
                                </button>
                              </>
                            )}

                          </div>
                        </td>

                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )
        ) : (
          displayedOnlineBookings.length === 0 ? (
            <div className="text-center py-20 text-gray-400">
              <Video className="w-12 h-12 mx-auto text-gray-300 stroke-[1.2] mb-3" />
              <h4 className="text-base font-bold text-gray-800">No Teleconsult Slots Scheduled</h4>
              <p className="text-xs text-gray-400 mt-1">Consultation details matching filter criteria will show here.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-[#0c213e] text-white text-xs font-bold uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-4">Visit Type</th>
                    <th className="px-6 py-4">Patient Profile</th>
                    <th className="px-6 py-4">Consultation Fee</th>
                    <th className="px-6 py-4">Scheduled Date</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-150 text-sm text-gray-700">
                  {displayedOnlineBookings.map((b) => {
                    const dateObj = new Date(b.dateTime);
                    const formattedDate = dateObj.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
                    const formattedTime = dateObj.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
                    const prescribed = prescribedIds.includes(b._id);

                    return (
                      <tr key={b._id} className="hover:bg-gray-50/50 transition">
                        
                        {/* Visit Mode */}
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center gap-1.5 bg-indigo-50 border border-indigo-200 text-indigo-800 text-xs font-bold px-2.5 py-1 rounded-lg uppercase">
                            <Video className="w-3.5 h-3.5 text-indigo-500" />
                            {b.mode || "Online"}
                          </span>
                        </td>

                        {/* Profile details */}
                        <td className="px-6 py-4">
                          <div>
                            <span className="font-bold text-gray-900 block capitalize">{b.patient?.name}</span>
                            <span className="text-xs text-gray-500 mt-0.5 block">
                              {b.patient?.age} Yrs • {b.patient?.gender}
                            </span>
                            <span className="text-xs text-gray-400 block mt-0.5">
                              📞 {b.patient?.contact} {b.patient?.aadhar && `| Aadhar: ${b.patient.aadhar}`}
                            </span>
                          </div>
                        </td>

                        {/* Fee */}
                        <td className="px-6 py-4">
                          <span className="font-bold text-gray-900 flex items-center gap-0.5">
                            <IndianRupee size={13} className="text-gray-400" />
                            {b.fees}
                          </span>
                        </td>

                        {/* Schedule date */}
                        <td className="px-6 py-4">
                          <div>
                            <span className="font-semibold text-gray-800 block text-xs">{formattedDate}</span>
                            <span className="text-[10px] text-gray-400 block mt-0.5 flex items-center gap-0.5">
                              <Clock size={11} /> {formattedTime}
                            </span>
                          </div>
                        </td>

                        {/* Status */}
                        <td className="px-6 py-4">
                          <StatusBadge status={b.status} />
                        </td>

                        {/* Actions */}
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center gap-2">
                            
                            {b.status === "completed" ? (
                              prescribed ? (
                                <button
                                  onClick={() => 
                                    navigate(
                                      `/doctordashboard/${doctorId}/appointments/addPrescription/${b._id}/${b.patient?.aadhar || ""}`,
                                      { state: { name: b.patient?.name, gender: b.patient?.gender, mobileNumber: b.patient?.contact } }
                                    )
                                  }
                                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold transition cursor-pointer"
                                >
                                  <Printer size={13} className="text-emerald-600" /> View / Print Rx
                                </button>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-gray-50 border border-gray-200 text-gray-400 rounded-xl text-xs font-bold">
                                  <Lock size={12} className="text-gray-400" /> Closed
                                </span>
                              )
                            ) : (
                              <>
                                {b.status === "pending" && (
                                  <button
                                    onClick={() => completeOnline(b._id)}
                                    disabled={completingId === b._id}
                                    className="inline-flex items-center gap-1 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 disabled:bg-gray-100 text-emerald-700 border border-emerald-250 rounded-xl text-xs font-bold transition cursor-pointer"
                                    title="Mark Completed"
                                  >
                                    <Check className="w-3.5 h-3.5" />
                                    {completingId === b._id ? "..." : "Complete"}
                                  </button>
                                )}

                                <button
                                  onClick={() => 
                                    navigate(
                                      `/doctordashboard/${doctorId}/appointments/addPrescription/${b._id}/${b.patient?.aadhar || ""}`,
                                      { state: { name: b.patient?.name, gender: b.patient?.gender, mobileNumber: b.patient?.contact } }
                                    )
                                  }
                                  className={`inline-flex items-center gap-1 px-4 py-2 rounded-xl text-xs font-bold border transition cursor-pointer ${prescribed ? "bg-gray-100 text-gray-400 border-gray-250" : "bg-[#0c213e] hover:bg-blue-900 text-white border-[#0c213e]"}`}
                                >
                                  {prescribed ? (
                                    <>
                                      <CheckCircle size={14} className="text-emerald-500" /> Prescribed
                                    </>
                                  ) : (
                                    <>
                                      Consult <ArrowRight size={14} />
                                    </>
                                  )}
                                </button>
                              </>
                            )}

                          </div>
                        </td>

                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )
        )}

      </div>

    </div>
  );
}