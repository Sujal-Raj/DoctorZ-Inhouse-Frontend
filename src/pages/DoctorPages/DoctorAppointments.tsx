import { useEffect, useState, useMemo } from "react";
import {
  CalendarDaysIcon,
  CurrencyRupeeIcon,
  ClockIcon,
  UserIcon,
  CheckIcon,
  HashtagIcon,
  BuildingStorefrontIcon,
  VideoCameraIcon,
} from "@heroicons/react/24/solid";
import { 
  Search, Users, CheckCircle, Clock, AlertCircle, Calendar,
  ArrowRight, Filter, RefreshCw
} from "lucide-react";
import api from "../../Services/mainApi";
import { useLocation, useNavigate } from "react-router-dom";

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
  status: "pending" | "completed";
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
  status: "pending" | "completed" | "registered" | "waiting" | "in-consultation" | "cancelled";
  paid: boolean;
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
    pending: "bg-amber-50 text-amber-700 border-amber-200",
    completed: "bg-emerald-50 text-emerald-700 border-emerald-200",
    cancelled: "bg-red-50 text-red-700 border-red-200",
    waiting: "bg-blue-50 text-blue-700 border-blue-200",
    "in-consultation": "bg-purple-50 text-purple-700 border-purple-200",
    registered: "bg-gray-50 text-gray-700 border-gray-200"
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${styles[status] ?? "bg-gray-50 text-gray-700 border-gray-200"}`}>
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
    } catch (err) {
      console.error("Failed to update online status:", err);
    } finally{
      setCompletingId(null);
    }
  };

  const completeOffline = async (id: string) => {
    try {
      setCompletingId(id);
      await api.put(`/api/bookOffline/${id}/status`, { status: "completed" });
      fetchOfflineBookings();
    } catch (err) {
      console.error("Failed to update offline status:", err);
    } finally{
      setCompletingId(null);
    }
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

  // ─── Grouping offline and online bookings ─────────────────────────────────────
  const { today, endOfWeek } = getWeekBounds();
  const todayStr = today.toISOString().split("T")[0];
  const endOfWeekStr = endOfWeek.toISOString().split("T")[0];

  // Online Filtered
  const todayOnline = filteredOnlineBookings.filter(
    (b) => b.dateTime && new Date(b.dateTime).toDateString() === today.toDateString()
  );
  const weekOnline = filteredOnlineBookings.filter((b) => {
    if (!b.dateTime) return false;
    const d = new Date(b.dateTime);
    return d.toDateString() !== today.toDateString() && d >= today && d <= endOfWeek;
  });
  const upcomingOnline = filteredOnlineBookings.filter(
    (b) => b.dateTime && new Date(b.dateTime) > endOfWeek
  );

  // Offline Filtered
  const todayOffline = filteredOfflineBookings.filter((b) => b.date && b.date.slice(0, 10) === todayStr);
  const weekOffline = filteredOfflineBookings.filter((b) => {
    if (!b.date) return false;
    const d = b.date.slice(0, 10);
    return d !== todayStr && d >= todayStr && d <= endOfWeekStr;
  });
  const upcomingOffline = filteredOfflineBookings.filter(
    (b) => b.date && b.date.slice(0, 10) > endOfWeekStr
  );

  // Totals for Dashboard
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

  // Render cards helper
  const renderOnlineCard = (b: OnlineBooking) => {
    const dateObj = new Date(b.dateTime);
    const formattedDate = dateObj.toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" });
    const formattedTime = dateObj.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
    const prescribed = prescribedIds.includes(b._id);

    return (
      <div key={b._id} className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs hover:shadow-md hover:border-blue-300 transition flex flex-col justify-between group">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
              <VideoCameraIcon className="w-3.5 h-3.5" />
              Online Consult
            </div>
            <StatusBadge status={b.status} />
          </div>

          <div>
            <h3 className="text-base font-bold text-gray-900 capitalize group-hover:text-blue-900 transition-colors">
              {b.patient?.name}
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              {b.patient?.age} Yrs • {b.patient?.gender}
            </p>
            <p className="text-xs text-gray-400 mt-1">📞 {b.patient?.contact}</p>
          </div>

          <div className="pt-2 border-t border-gray-100 grid grid-cols-2 gap-2 text-xs text-gray-600">
            <div className="flex items-center gap-1">
              <CalendarDaysIcon className="w-4 h-4 text-gray-400" />
              <span>{formattedDate}</span>
            </div>
            <div className="flex items-center gap-1">
              <ClockIcon className="w-4 h-4 text-gray-400" />
              <span>{formattedTime}</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2 mt-5">
          {b.status === "pending" && (
            <button
              onClick={() => completeOnline(b._id)}
              disabled={completingId === b._id}
              className="w-full flex items-center justify-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 disabled:bg-gray-100 text-emerald-700 py-2 rounded-xl text-xs font-bold border border-emerald-250 transition"
            >
              {completingId === b._id ? "Completing..." : (
                <>
                  <CheckIcon className="w-4 h-4" />
                  Complete Consultation
                </>
              )}
            </button>
          )}
          
          <button
            onClick={() => 
              navigate(
                `/doctordashboard/${doctorId}/appointments/addPrescription/${b._id}/${b.patient?.aadhar || ""}`,
                { state: { name: b.patient?.name, gender: b.patient?.gender, mobileNumber: b.patient?.contact } }
              )
            }
            className={`w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition border ${prescribed ? "bg-gray-50 text-gray-400 border-gray-250" : "bg-[#0c213e] hover:bg-blue-900 text-white border-[#0c213e]"}`}
          >
            {prescribed ? (
              <>
                <CheckCircle size={14} className="text-green-500" /> Prescription Done
              </>
            ) : (
              <>
                Write Prescription <ArrowRight size={14} />
              </>
            )}
          </button>
        </div>
      </div>
    );
  };

  const renderOfflineCard = (b: OfflineBooking) => {
    const formattedDate = b.date ? new Date(b.date).toLocaleDateString("en-IN", {
      day: "2-digit", month: "long", year: "numeric",
    }) : "—";
    
    const patientName = b.userId?.fullName || b.patient?.name || "Walk-in Patient";
    const patientGender = b.userId?.gender || b.patient?.gender || "Unknown";
    const patientPhone = b.userId?.mobileNumber || b.patient?.contact || "No Contact";
    const patientAadhar = b.userId?.aadhar || b.patient?.aadhar || "";
    const prescribed = prescribedIds.includes(b._id);

    return (
      <div key={b._id} className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs hover:shadow-md hover:border-amber-300 transition flex flex-col justify-between group">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 bg-amber-50 text-amber-700 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
              <BuildingStorefrontIcon className="w-3.5 h-3.5" />
              Walk-in (Token #{b.tokenNumber})
            </div>
            <StatusBadge status={b.status} />
          </div>

          <div>
            <h3 className="text-base font-bold text-gray-900 capitalize group-hover:text-amber-900 transition-colors flex items-center gap-1.5">
              {patientName}
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              {b.userId?.dob ? `${new Date().getFullYear() - new Date(b.userId.dob).getFullYear()} Yrs • ` : ""}
              {b.patient?.age ? `${b.patient.age} Yrs • ` : ""}
              {patientGender}
            </p>
            <p className="text-xs text-gray-400 mt-1">📞 {patientPhone}</p>
          </div>

          <div className="pt-2 border-t border-gray-100 grid grid-cols-2 gap-2 text-xs text-gray-600">
            <div className="flex items-center gap-1">
              <CalendarDaysIcon className="w-4 h-4 text-gray-400" />
              <span>{formattedDate}</span>
            </div>
            <div className="flex items-center gap-1">
              <CurrencyRupeeIcon className="w-4 h-4 text-gray-400" />
              <span>₹{b.fees}</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2 mt-5">
          {b.status === "pending" && (
            <button
              onClick={() => completeOffline(b._id)}
              disabled={completingId === b._id}
              className="w-full flex items-center justify-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 disabled:bg-gray-100 text-emerald-700 py-2 rounded-xl text-xs font-bold border border-emerald-250 transition"
            >
              {completingId === b._id ? "Completing..." : (
                <>
                  <CheckIcon className="w-4 h-4" />
                  Complete Appointment
                </>
              )}
            </button>
          )}

          <button
            onClick={() => 
              navigate(
                `/doctordashboard/${doctorId}/appointments/addPrescription/${b._id}/${patientAadhar}`,
                { state: { name: patientName, gender: patientGender, mobileNumber: patientPhone } }
              )
            }
            className={`w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition border ${prescribed ? "bg-gray-50 text-gray-400 border-gray-250" : "bg-[#0c213e] hover:bg-blue-900 text-white border-[#0c213e]"}`}
          >
            {prescribed ? (
              <>
                <CheckCircle size={14} className="text-green-500" /> Prescription Done
              </>
            ) : (
              <>
                Write Prescription <ArrowRight size={14} />
              </>
            )}
          </button>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-[400px]">
        <RefreshCw className="w-10 h-10 text-[#0c213e] animate-spin mb-4" />
        <p className="text-gray-500 font-medium">Reconciling doctor appointment queues...</p>
      </div>
    );
  }

  return (
    <div className="w-full p-6 space-y-6">
      
      {/* ─── Header & Search Row ──────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-200 shadow-xs">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Patient Appointments</h1>
          <p className="text-sm text-gray-500">Manage walk-in lists and online consultations for today.</p>
        </div>

        {/* Search Bar */}
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-gray-400" />
          <input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search patient name / contact..."
            className="w-full border border-gray-300 rounded-xl pl-10 pr-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
          />
        </div>
      </div>

      {/* ─── Vitals Stats Cards ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Total Active Queue */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5 flex items-center gap-4 shadow-xs">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <span className="text-gray-400 text-xs font-semibold uppercase tracking-wider">Total Active Queue</span>
            <h3 className="text-2xl font-bold text-gray-900 mt-0.5">{totals.totalActive}</h3>
          </div>
        </div>

        {/* Walk-in Waiting */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5 flex items-center gap-4 shadow-xs">
          <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center shrink-0">
            <BuildingStorefrontIcon className="w-6 h-6" />
          </div>
          <div>
            <span className="text-gray-400 text-xs font-semibold uppercase tracking-wider">Walk-in Waiting</span>
            <h3 className="text-2xl font-bold text-gray-900 mt-0.5">{totals.waitingWalkins}</h3>
          </div>
        </div>

        {/* Online Consulting */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5 flex items-center gap-4 shadow-xs">
          <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center shrink-0">
            <VideoCameraIcon className="w-6 h-6" />
          </div>
          <div>
            <span className="text-gray-400 text-xs font-semibold uppercase tracking-wider">Online Consulting</span>
            <h3 className="text-2xl font-bold text-gray-900 mt-0.5">{totals.waitingOnline}</h3>
          </div>
        </div>

        {/* Consultations Done */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5 flex items-center gap-4 shadow-xs">
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center shrink-0">
            <CheckCircle className="w-6 h-6" />
          </div>
          <div>
            <span className="text-gray-400 text-xs font-semibold uppercase tracking-wider">Consultations Done</span>
            <h3 className="text-2xl font-bold text-gray-900 mt-0.5">{totals.completedToday}</h3>
          </div>
        </div>

      </div>

      {/* ─── Tab Switcher ────────────────────────────────────────────────────── */}
      <div className="flex gap-2 p-1 bg-gray-100 rounded-xl border border-gray-200 w-fit">
        <button
          onClick={() => setActiveTab("offline")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-bold transition-all uppercase tracking-wide cursor-pointer ${
            activeTab === "offline"
              ? "bg-[#0c213e] text-white shadow"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          <BuildingStorefrontIcon className="w-4 h-4" />
          Walk-in Patients
        </button>
        <button
          onClick={() => setActiveTab("online")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-bold transition-all uppercase tracking-wide cursor-pointer ${
            activeTab === "online"
              ? "bg-[#0c213e] text-white shadow"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          <VideoCameraIcon className="w-4 h-4" />
          Online Teleconsults
        </button>
      </div>

      {/* ─── Online Tab Content ─────────────────────────────────────────────── */}
      {activeTab === "online" && (
        <div className="space-y-8">
          {filteredOnlineBookings.length === 0 ? (
            <div className="text-center bg-white border border-gray-200 rounded-2xl p-12 text-gray-400 shadow-xs">
              <VideoCameraIcon className="w-12 h-12 mx-auto stroke-[1.5] text-gray-300 mb-2" />
              <p className="text-sm font-semibold">No Online Teleconsults Scheduled</p>
              <p className="text-xs text-gray-400 mt-1">Check back later or refresh dashboard.</p>
            </div>
          ) : (
            <>
              {todayOnline.length > 0 && (
                <div>
                  <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <Clock size={16} className="text-blue-600" /> Today's Teleconsults
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                    {todayOnline.map(renderOnlineCard)}
                  </div>
                </div>
              )}

              {weekOnline.length > 0 && (
                <div>
                  <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <Calendar size={16} className="text-blue-600" /> Scheduled This Week
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                    {weekOnline.map(renderOnlineCard)}
                  </div>
                </div>
              )}

              {upcomingOnline.length > 0 && (
                <div>
                  <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <Calendar size={16} className="text-blue-600" /> Upcoming Schedules
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                    {upcomingOnline.map(renderOnlineCard)}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ─── Offline Tab Content ────────────────────────────────────────────── */}
      {activeTab === "offline" && (
        <div className="space-y-8">
          {filteredOfflineBookings.length === 0 ? (
            <div className="text-center bg-white border border-gray-200 rounded-2xl p-12 text-gray-400 shadow-xs">
              <BuildingStorefrontIcon className="w-12 h-12 mx-auto stroke-[1.5] text-gray-300 mb-2" />
              <p className="text-sm font-semibold">No Walk-in Patients In Queue</p>
              <p className="text-xs text-gray-400 mt-1">Reception check-ins will show up here.</p>
            </div>
          ) : (
            <>
              {todayOffline.length > 0 && (
                <div>
                  <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <Clock size={16} className="text-amber-600" /> Today's Walk-in Queue
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                    {todayOffline.map(renderOfflineCard)}
                  </div>
                </div>
              )}

              {weekOffline.length > 0 && (
                <div>
                  <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <Calendar size={16} className="text-amber-600" /> Scheduled This Week
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                    {weekOffline.map(renderOfflineCard)}
                  </div>
                </div>
              )}

              {upcomingOffline.length > 0 && (
                <div>
                  <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <Calendar size={16} className="text-amber-600" /> Upcoming Schedules
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                    {upcomingOffline.map(renderOfflineCard)}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

    </div>
  );
}