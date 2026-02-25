import { useEffect, useState } from "react";

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
import api from "../../Services/mainApi";
import { useNavigate } from "react-router-dom";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Patient {
  name: string;
  age: number;
  gender: string;
  contact: string;
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

interface OfflineBooking {
  _id: string;
  patient: Patient;
  date: string;          // "YYYY-MM-DD"
  tokenNumber: number;
  fees: number;
  status: "pending" | "completed" | "cancelled";
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

// ─── Status badge ─────────────────────────────────────────────────────────────

const StatusBadge = ({ status }: { status: string }) => {
  const styles: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800",
    completed: "bg-green-100 text-green-800",
    cancelled: "bg-red-100 text-red-800",
  };
  return (
    <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold capitalize ${styles[status] ?? "bg-gray-100 text-gray-700"}`}>
      {status}
    </span>
  );
};

// ─── Online booking card ──────────────────────────────────────────────────────

const OnlineBookingCard = ({
  b,
  onComplete,
  onPrescription,
}: {
  b: OnlineBooking;
  onComplete: (id: string) => void;
  onPrescription: (b: OnlineBooking) => void;
}) => {
  const dateObj = new Date(b.dateTime);
  const formattedDate = dateObj.toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" });
  const formattedTime = dateObj.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm hover:shadow-md transition flex flex-col gap-3">
      {/* Mode chip */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full text-xs font-semibold w-fit">
          <VideoCameraIcon className="w-3.5 h-3.5" />
          Online
        </div>
        <StatusBadge status={b.status} />
      </div>

      {/* Patient */}
      <div>
        <div className="flex items-center gap-2">
          <UserIcon className="text-gray-500 w-5 h-5" />
          <h3 className="text-base font-semibold text-gray-900 capitalize">{b.patient?.name}</h3>
        </div>
        <p className="text-gray-500 text-sm ml-7">{b.patient?.age} yrs • {b.patient?.gender}</p>
        <p className="text-gray-500 text-sm ml-7">Contact: {b.patient?.contact}</p>
      </div>

      {/* Appointment details */}
      <div className="text-sm text-gray-600 space-y-1.5">
        <p className="flex items-center gap-2">
          <CalendarDaysIcon className="w-4 h-4 text-gray-400 shrink-0" />
          {formattedDate}
        </p>
        <p className="flex items-center gap-2">
          <ClockIcon className="w-4 h-4 text-gray-400 shrink-0" />
          {formattedTime}
        </p>
        <p className="flex items-center gap-2">
          <CurrencyRupeeIcon className="w-4 h-4 text-gray-400 shrink-0" />
          ₹{b.fees}
        </p>
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-2 mt-auto">
        {b.status === "pending" && (
          <button
            onClick={() => onComplete(b._id)}
            className="w-full flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white py-2 rounded-lg text-sm font-medium transition"
          >
            <CheckIcon className="w-4 h-4" />
            Complete Appointment
          </button>
        )}
        <button
          onClick={() => onPrescription(b)}
          className="w-full flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-lg text-sm font-medium transition"
        >
          Give Prescription
        </button>
      </div>
    </div>
  );
};

// ─── Offline booking card ─────────────────────────────────────────────────────

const OfflineBookingCard = ({
  b,
  onComplete,
}: {
  b: OfflineBooking;
  onComplete: (id: string) => void;
}) => {
  const formattedDate = new Date(b.date).toLocaleDateString("en-IN", {
    day: "2-digit", month: "long", year: "numeric",
  });

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm hover:shadow-md transition flex flex-col gap-3">
      {/* Mode chip */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 bg-orange-50 text-orange-700 px-2.5 py-1 rounded-full text-xs font-semibold w-fit">
          <BuildingStorefrontIcon className="w-3.5 h-3.5" />
          Walk-in
        </div>
        <StatusBadge status={b.status} />
      </div>

      {/* Patient */}
      <div>
        <div className="flex items-center gap-2">
          <UserIcon className="text-gray-500 w-5 h-5" />
          <h3 className="text-base font-semibold text-gray-900 capitalize">{b.patient?.name}</h3>
        </div>
        <p className="text-gray-500 text-sm ml-7">{b.patient?.age} yrs • {b.patient?.gender}</p>
        <p className="text-gray-500 text-sm ml-7">Contact: {b.patient?.contact}</p>
      </div>

      {/* Appointment details */}
      <div className="text-sm text-gray-600 space-y-1.5">
        <p className="flex items-center gap-2">
          <CalendarDaysIcon className="w-4 h-4 text-gray-400 shrink-0" />
          {formattedDate}
        </p>
        <p className="flex items-center gap-2">
          <HashtagIcon className="w-4 h-4 text-gray-400 shrink-0" />
          Token No. <span className="font-bold text-[#0c213e]">#{b.tokenNumber}</span>
        </p>
        <p className="flex items-center gap-2">
          <CurrencyRupeeIcon className="w-4 h-4 text-gray-400 shrink-0" />
          ₹{b.fees}
        </p>
      </div>

      {/* Actions */}
      {b.status === "pending" && (
        <div className="mt-auto">
          <button
            onClick={() => onComplete(b._id)}
            className="w-full flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white py-2 rounded-lg text-sm font-medium transition"
          >
            <CheckIcon className="w-4 h-4" />
            Complete Appointment
          </button>
        </div>
      )}
    </div>
  );
};

// ─── Section group renderer ───────────────────────────────────────────────────

function SectionGroup<T,>({
  title,
  list,
  renderCard,
}: {
  title: string;
  list: T[];
  renderCard: (item: T) => React.ReactNode;
}) {
  if (list.length === 0) return null;
  return (
    <div className="mb-8">
      <h3 className="text-2xl font-bold text-gray-700 mb-4">{title}</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 w-full max-w-screen-xl">
        {list.map((item) => renderCard(item))}
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function DoctorAppointments() {
  const [onlineBookings, setOnlineBookings] = useState<OnlineBooking[]>([]);
  const [offlineBookings, setOfflineBookings] = useState<OfflineBooking[]>([]);
  const [activeTab, setActiveTab] = useState<"online" | "offline">("online");
  const [loading, setLoading] = useState(true);

  const doctorId = localStorage.getItem("doctorId");
  const navigate = useNavigate();

  // ── Fetch ──────────────────────────────────────────────────────────────────

  const fetchOnlineBookings = async () => {
    if (!doctorId) return;
    try {
      const { data } = await api.get<{ bookings: OnlineBooking[] }>(
        `/api/booking/doctor/${doctorId}`
      );
      if (data.bookings?.length > 0) {
        const { today, startOfWeek, endOfWeek } = getWeekBounds();

        const todayList = data.bookings.filter(
          (b) => new Date(b.dateTime).toDateString() === today.toDateString()
        );
        const weekList = data.bookings.filter((b) => {
          const d = new Date(b.dateTime);
          return d.toDateString() !== today.toDateString() && d >= startOfWeek && d <= endOfWeek;
        });
        const upcomingList = data.bookings.filter(
          (b) => new Date(b.dateTime) > endOfWeek
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

  // ── Status updates ─────────────────────────────────────────────────────────

  const completeOnline = async (id: string) => {
    try {
      await api.put(`/api/booking/${id}/status`, { status: "completed" });
      fetchOnlineBookings();
    } catch (err) {
      console.error("Failed to update online status:", err);
    }
  };

  const completeOffline = async (id: string) => {
    try {
      await api.put(`/api/bookOffline/${id}/status`, { status: "completed" });
      fetchOfflineBookings();
    } catch (err) {
      console.error("Failed to update offline status:", err);
    }
  };

  // ── Group online by time period ────────────────────────────────────────────

  const { today, startOfWeek, endOfWeek } = getWeekBounds();

  const todayOnline = onlineBookings.filter(
    (b) => new Date(b.dateTime).toDateString() === today.toDateString()
  );
  const weekOnline = onlineBookings.filter((b) => {
    const d = new Date(b.dateTime);
    return d.toDateString() !== today.toDateString() && d >= startOfWeek && d <= endOfWeek;
  });
  const upcomingOnline = onlineBookings.filter(
    (b) => new Date(b.dateTime) > endOfWeek
  );

  // ── Group offline by time period ───────────────────────────────────────────

  const todayStr = today.toISOString().split("T")[0];
  const endOfWeekStr = endOfWeek.toISOString().split("T")[0];

  const todayOffline = offlineBookings.filter((b) => b.date.slice(0, 10) === todayStr);
  const weekOffline = offlineBookings.filter((b) => {
    const d = b.date.slice(0, 10);
    return d !== todayStr && d >= todayStr && d <= endOfWeekStr;
  });
  const upcomingOffline = offlineBookings.filter(
    (b) => b.date.slice(0, 10) > endOfWeekStr
  );

  // ── Render ─────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="p-4 ml-5 lg:p-8 flex flex-col w-full">
        <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-6 text-gray-800">Appointments</h2>
        <div className="flex justify-center py-16">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-gray-200 border-t-[#0c213e]" />
        </div>
      </div>
    );
  }

  const hasOnline = onlineBookings.length > 0;
  const hasOffline = offlineBookings.length > 0;

  return (
    <div className="p-4 ml-5 lg:p-8 flex flex-col w-full">
      <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-6 text-gray-800">Appointments</h2>

      {/* ── Tab switcher ── */}
      <div className="flex gap-2 mb-8">
        <button
          onClick={() => setActiveTab("online")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold border transition-all ${
            activeTab === "online"
              ? "bg-[#0c213e] text-white border-[#0c213e] shadow"
              : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"
          }`}
        >
          <VideoCameraIcon className="w-4 h-4" />
          Online
          {hasOnline && (
            <span className={`ml-1 px-2 py-0.5 rounded-full text-xs font-bold ${activeTab === "online" ? "bg-white/20 text-white" : "bg-gray-100 text-gray-600"}`}>
              {onlineBookings.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab("offline")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold border transition-all ${
            activeTab === "offline"
              ? "bg-[#0c213e] text-white border-[#0c213e] shadow"
              : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"
          }`}
        >
          <BuildingStorefrontIcon className="w-4 h-4" />
          Walk-in
          {hasOffline && (
            <span className={`ml-1 px-2 py-0.5 rounded-full text-xs font-bold ${activeTab === "offline" ? "bg-white/20 text-white" : "bg-gray-100 text-gray-600"}`}>
              {offlineBookings.length}
            </span>
          )}
        </button>
      </div>

      {/* ── Online tab ── */}
      {activeTab === "online" && (
        <>
          {!hasOnline ? (
            <div className="text-center text-gray-500 py-10 text-lg">No online appointments</div>
          ) : (
            <>
              <SectionGroup
                title="Today's Appointments"
                list={todayOnline}
                renderCard={(b) => (
                  <OnlineBookingCard
                    key={b._id}
                    b={b}
                    onComplete={completeOnline}
                    onPrescription={(b) =>
                      navigate(
                        `/doctordashboard/${doctorId}/appointments/addPrescription/${b._id}/${b.patient?.aadhar}`,
                        { state: { name: b.patient?.name, gender: b.patient?.gender } }
                      )
                    }
                  />
                )}
              />
              <SectionGroup
                title="This Week's Appointments"
                list={weekOnline}
                renderCard={(b) => (
                  <OnlineBookingCard
                    key={b._id}
                    b={b}
                    onComplete={completeOnline}
                    onPrescription={(b) =>
                      navigate(
                        `/doctordashboard/${doctorId}/appointments/addPrescription/${b._id}/${b.patient?.aadhar}`,
                        { state: { name: b.patient?.name, gender: b.patient?.gender } }
                      )
                    }
                  />
                )}
              />
              <SectionGroup
                title="Upcoming Appointments"
                list={upcomingOnline}
                renderCard={(b) => (
                  <OnlineBookingCard
                    key={b._id}
                    b={b}
                    onComplete={completeOnline}
                    onPrescription={(b) =>
                      navigate(
                        `/doctordashboard/${doctorId}/appointments/addPrescription/${b._id}/${b.patient?.aadhar}`,
                        { state: { name: b.patient?.name, gender: b.patient?.gender } }
                      )
                    }
                  />
                )}
              />
            </>
          )}
        </>
      )}

      {/* ── Offline (Walk-in) tab ── */}
      {activeTab === "offline" && (
        <>
          {!hasOffline ? (
            <div className="text-center text-gray-500 py-10 text-lg">No walk-in appointments</div>
          ) : (
            <>
              <SectionGroup
                title="Today's Walk-ins"
                list={todayOffline}
                renderCard={(b) => (
                  <OfflineBookingCard key={b._id} b={b} onComplete={completeOffline} />
                )}
              />
              <SectionGroup
                title="This Week's Walk-ins"
                list={weekOffline}
                renderCard={(b) => (
                  <OfflineBookingCard key={b._id} b={b} onComplete={completeOffline} />
                )}
              />
              <SectionGroup
                title="Upcoming Walk-ins"
                list={upcomingOffline}
                renderCard={(b) => (
                  <OfflineBookingCard key={b._id} b={b} onComplete={completeOffline} />
                )}
              />
            </>
          )}
        </>
      )}
    </div>
  );
}