import { useEffect, useState, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Users, Search, Video, MapPin, Phone, Hash, IndianRupee,
  Download, ArrowUpDown, Filter, RefreshCw, FileText, ChevronRight, X
} from "lucide-react";
import api from "../../Services/mainApi";
import Swal from "sweetalert2";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Patient {
  _id: string;
  name: string;
  age: number;
  gender: string;
  contact: string;
  aadhar: string;
  photo?: string;
}

interface OnlineBooking {
  _id: string;
  patient: Patient | null;
  mode: string;
  fees: number;
  roomId: string;
  doctorId: string;
  meetingLink: string;
  source: "online";
  dateTime?: string;
}

interface OfflineBooking {
  _id: string;
  doctorId: string;
  userId: { _id: string; fullName: string };
  patient: string; // name string in offline
  tokenNumber: number;
  date: string;
  fees: number;
  status: "pending" | "completed" | "cancelled";
  paid?: boolean;
  bookedBy: string;
  source: "offline";
}

type AnyBooking = OnlineBooking | OfflineBooking;
type TabValue = "all" | "online" | "offline";
type PaymentFilter = "all" | "paid" | "unpaid";
type SortField = "name" | "date" | "fees";
type SortOrder = "asc" | "desc";

export default function AllPatient() {
  const navigate = useNavigate();
  const { drId } = useParams<{ drId: string }>();

  const [onlineBookings, setOnlineBookings] = useState<OnlineBooking[]>([]);
  const [offlineBookings, setOfflineBookings] = useState<OfflineBooking[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Advanced Filter States
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<TabValue>("all");
  const [paymentFilter, setPaymentFilter] = useState<PaymentFilter>("all");
  const [sortField, setSortField] = useState<SortField>("date");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [showFiltersDrawer, setShowFiltersDrawer] = useState(false);

  // ─── Fetch Data ─────────────────────────────────────────────────────────────

  const fetchAll = async () => {
    if (!drId) return;
    setLoading(true);
    try {
      const [onlineRes, offlineRes] = await Promise.allSettled([
        api.get<{ bookings: Omit<OnlineBooking, "source">[] }>(
          `/api/booking/doctor/${drId}/all-patient`
        ),
        api.get<{ bookings: Omit<OfflineBooking, "source">[] }>(
          `/api/bookOffline/doctor/${drId}/all-patient`
        ),
      ]);

      if (onlineRes.status === "fulfilled") {
        setOnlineBookings(
          (onlineRes.value.data.bookings || []).map((b) => ({
            ...b,
            source: "online" as const,
          }))
        );
      }

      if (offlineRes.status === "fulfilled") {
        setOfflineBookings(
          (offlineRes.value.data.bookings || []).map((b) => ({
            ...b,
            source: "offline" as const,
          }))
        );
      }
    } catch (err) {
      console.error("Error fetching patients:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, [drId]);

  // ─── Helpers ──────────────────────────────────────────────────────────────────

  const isOnline = (b: AnyBooking): b is OnlineBooking => b.source === "online";
  const isOffline = (b: AnyBooking): b is OfflineBooking => b.source === "offline";

  const getPatientName = (b: AnyBooking) =>
    isOnline(b) ? b.patient?.name ?? "Online Patient" : b.patient || "Walk-in Patient";

  const getPatientContact = (b: AnyBooking) =>
    isOnline(b) ? b.patient?.contact ?? "—" : "—";

  const getBookingDate = (b: AnyBooking) => {
    if (isOnline(b)) return b.dateTime ? new Date(b.dateTime) : new Date(0);
    return b.date ? new Date(b.date) : new Date(0);
  };

  const allBookings = useMemo(() => {
    return [...onlineBookings, ...offlineBookings];
  }, [onlineBookings, offlineBookings]);

  // ─── Analytics Summary ──────────────────────────────────────────────────────

  const stats = useMemo(() => {
    const total = allBookings.length;
    const onlineCount = onlineBookings.length;
    const offlineCount = offlineBookings.length;
    const totalFees = allBookings.reduce((sum, b) => sum + (b.fees || 0), 0);
    return { total, onlineCount, offlineCount, totalFees };
  }, [allBookings, onlineBookings, offlineBookings]);

  // ─── Filtering & Sorting ────────────────────────────────────────────────────

  const filteredAndSortedBookings = useMemo(() => {
    // 1. Filter
    let result = allBookings.filter((b) => {
      // Source Tab
      const matchesTab =
        activeTab === "all" ||
        (activeTab === "online" && b.source === "online") ||
        (activeTab === "offline" && b.source === "offline");

      // Search term
      const name = getPatientName(b).toLowerCase();
      const phone = getPatientContact(b);
      const matchesSearch =
        name.includes(searchTerm.toLowerCase()) ||
        phone.includes(searchTerm);

      // Payment Status
      let matchesPayment = true;
      if (paymentFilter !== "all") {
        const isPaid = isOffline(b) ? b.paid : true; // Online is auto-paid
        matchesPayment = paymentFilter === "paid" ? !!isPaid : !isPaid;
      }

      return matchesTab && matchesSearch && matchesPayment;
    });

    // 2. Sort
    result.sort((a, b) => {
      let comparison = 0;
      if (sortField === "name") {
        comparison = getPatientName(a).localeCompare(getPatientName(b));
      } else if (sortField === "date") {
        comparison = getBookingDate(a).getTime() - getBookingDate(b).getTime();
      } else if (sortField === "fees") {
        comparison = (a.fees || 0) - (b.fees || 0);
      }
      return sortOrder === "asc" ? comparison : -comparison;
    });

    return result;
  }, [allBookings, searchTerm, activeTab, paymentFilter, sortField, sortOrder]);

  // ─── Export to CSV Helper ───────────────────────────────────────────────────

  const handleExportCSV = () => {
    if (filteredAndSortedBookings.length === 0) {
      Swal.fire({ title: "No records to export", icon: "warning" });
      return;
    }

    const headers = ["Patient Name", "Consult Type", "Mode / Token", "Contact Number", "Fees (INR)", "Payment", "Date"];
    const rows = filteredAndSortedBookings.map((b) => {
      const name = getPatientName(b);
      const type = b.source === "online" ? "Online Teleconsult" : "Offline Walk-in";
      const tokenMode = b.source === "online" ? b.mode : `Token #${b.tokenNumber}`;
      const contact = getPatientContact(b);
      const fees = b.fees;
      const paymentStatus = b.source === "online" ? "Paid" : (b.paid ? "Paid" : "Unpaid");
      const dateStr = getBookingDate(b).toLocaleDateString("en-IN");
      return [name, type, tokenMode, contact, fees, paymentStatus, dateStr];
    });

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.map(val => `"${val}"`).join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `doctor_patient_registry_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleViewEMR = (aadhar?: string, name?: string, mobileNumber?: string) => {
    if (!drId) return;
    const id = aadhar || mobileNumber || name || "unknown";
    navigate(`/doctordashboard/${drId}/patientEMR/${id}`, {
      state: { aadhar, name, mobileNumber }
    });
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("desc");
    }
  };

  return (
    <main className="min-h-screen bg-gray-50/50 pb-12 font-[Poppins]">
      
      {/* ─── Header Section ─── */}
      <div className="bg-white border-b border-gray-200 px-6 py-6 sticky top-0 z-30">
        <div className="max-w-full w-full mx-auto flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
              <Users className="w-7 h-7 text-[#0c213e]" />
              Patient Registry
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Search, filter, and review active clinical records across online and walk-in practices.
            </p>
          </div>

          <div className="flex items-center gap-3 self-end lg:self-center">
            <button
              onClick={fetchAll}
              className="flex items-center gap-1.5 px-3.5 py-2.5 bg-gray-50 hover:bg-gray-100 text-gray-700 text-xs font-bold rounded-xl border border-gray-200 transition cursor-pointer"
              title="Refresh Registry"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer"
            >
              <Download className="w-4 h-4" /> Export CSV
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-full w-full mx-auto p-6 space-y-6">

        {/* ─── Vitals Statistics ─── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          
          <div className="bg-white border border-gray-200 rounded-2xl p-5 flex items-center gap-4 shadow-xs">
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center shrink-0">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <span className="text-gray-400 text-xs font-semibold uppercase tracking-wider block">Total Patients</span>
              <h3 className="text-2xl font-bold text-gray-900 mt-0.5">{stats.total}</h3>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl p-5 flex items-center gap-4 shadow-xs">
            <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center shrink-0">
              <Video className="w-6 h-6" />
            </div>
            <div>
              <span className="text-gray-400 text-xs font-semibold uppercase tracking-wider block">Teleconsults</span>
              <h3 className="text-2xl font-bold text-gray-900 mt-0.5">{stats.onlineCount}</h3>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl p-5 flex items-center gap-4 shadow-xs">
            <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center shrink-0">
              <MapPin className="w-6 h-6" />
            </div>
            <div>
              <span className="text-gray-400 text-xs font-semibold uppercase tracking-wider block">Walk-in Patients</span>
              <h3 className="text-2xl font-bold text-gray-900 mt-0.5">{stats.offlineCount}</h3>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl p-5 flex items-center gap-4 shadow-xs">
            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center shrink-0">
              <IndianRupee className="w-6 h-6" />
            </div>
            <div>
              <span className="text-gray-400 text-xs font-semibold uppercase tracking-wider block">Total Revenue</span>
              <h3 className="text-2xl font-bold text-gray-900 mt-0.5">₹{stats.totalFees}</h3>
            </div>
          </div>

        </div>

        {/* ─── Search & Advanced Filter Controls ─── */}
        <div className="bg-white border border-gray-200 p-5 rounded-2xl shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          
          {/* Search bar */}
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3.5 top-3 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name or contact number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition bg-white"
            />
          </div>

          {/* Quick Tabs & Filters */}
          <div className="flex flex-wrap items-center gap-3">
            
            {/* Tabs */}
            <div className="flex bg-gray-100 rounded-xl border border-gray-200 p-1">
              <button
                onClick={() => setActiveTab("all")}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${activeTab === "all" ? "bg-[#0c213e] text-white shadow-xs" : "text-gray-600 hover:text-gray-900"}`}
              >
                All
              </button>
              <button
                onClick={() => setActiveTab("online")}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${activeTab === "online" ? "bg-[#0c213e] text-white shadow-xs" : "text-gray-600 hover:text-gray-900"}`}
              >
                Online
              </button>
              <button
                onClick={() => setActiveTab("offline")}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${activeTab === "offline" ? "bg-[#0c213e] text-white shadow-xs" : "text-gray-600 hover:text-gray-900"}`}
              >
                Offline
              </button>
            </div>

            {/* Advanced Filters Button */}
            <button
              onClick={() => setShowFiltersDrawer(!showFiltersDrawer)}
              className={`flex items-center gap-1.5 px-4 py-2.5 border rounded-xl text-xs font-bold transition cursor-pointer ${showFiltersDrawer || paymentFilter !== "all" ? "bg-blue-50 text-blue-700 border-blue-200" : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"}`}
            >
              <Filter className="w-4 h-4" /> Filters {paymentFilter !== "all" ? "(Active)" : ""}
            </button>

          </div>
        </div>

        {/* Drawer Filters content */}
        {showFiltersDrawer && (
          <div className="bg-blue-50/50 border border-blue-100 p-5 rounded-2xl space-y-4 animate-fadeIn">
            <div className="flex items-center justify-between border-b border-blue-100/50 pb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-900">Advanced Filter Configuration</span>
              <button onClick={() => setShowFiltersDrawer(false)} className="text-blue-500 hover:text-blue-700">
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Payment Filter */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase block">Payment Status</label>
                <select
                  value={paymentFilter}
                  onChange={(e) => setPaymentFilter(e.target.value as PaymentFilter)}
                  className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="all">All Payments</option>
                  <option value="paid">Paid</option>
                  <option value="unpaid">Unpaid</option>
                </select>
              </div>

              {/* Sort field */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase block">Sort Column</label>
                <select
                  value={sortField}
                  onChange={(e) => setSortField(e.target.value as SortField)}
                  className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="date">Appointment Date</option>
                  <option value="name">Patient Name</option>
                  <option value="fees">Consult Fees</option>
                </select>
              </div>

              {/* Sort Order */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase block">Sort Direction</label>
                <div className="flex bg-white rounded-xl border border-gray-300 p-0.5">
                  <button
                    onClick={() => setSortOrder("asc")}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition ${sortOrder === "asc" ? "bg-blue-600 text-white" : "text-gray-600"}`}
                  >
                    Ascending
                  </button>
                  <button
                    onClick={() => setSortOrder("desc")}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition ${sortOrder === "desc" ? "bg-blue-600 text-white" : "text-gray-600"}`}
                  >
                    Descending
                  </button>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* ─── Patient Data Table ─── */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 text-gray-500">
                <RefreshCw className="w-10 h-10 text-[#0c213e] animate-spin mb-4" />
                <p className="font-semibold text-sm">Refreshing registry indexes...</p>
              </div>
            ) : filteredAndSortedBookings.length === 0 ? (
              <div className="text-center py-20 text-gray-400">
                <FileText className="w-16 h-16 mx-auto text-gray-300 stroke-[1.2] mb-3" />
                <h4 className="text-base font-bold text-gray-800">No Patient Records Match Filters</h4>
                <p className="text-xs text-gray-400 mt-1">Try resetting search string or filter attributes.</p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead className="bg-[#0c213e] text-white text-xs font-bold uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-4 cursor-pointer select-none hover:bg-blue-950 transition" onClick={() => handleSort("name")}>
                      <div className="flex items-center gap-1">
                        Patient Name
                        <ArrowUpDown size={12} className={sortField === "name" ? "text-blue-300" : "text-white/40"} />
                      </div>
                    </th>
                    <th className="px-6 py-4">Context</th>
                    <th className="px-6 py-4">Details</th>
                    <th className="px-6 py-4">Contact Number</th>
                    <th className="px-6 py-4 cursor-pointer select-none hover:bg-blue-950 transition" onClick={() => handleSort("fees")}>
                      <div className="flex items-center gap-1">
                        Fees
                        <ArrowUpDown size={12} className={sortField === "fees" ? "text-blue-300" : "text-white/40"} />
                      </div>
                    </th>
                    <th className="px-6 py-4 cursor-pointer select-none hover:bg-blue-950 transition" onClick={() => handleSort("date")}>
                      <div className="flex items-center gap-1">
                        Appointment Date
                        <ArrowUpDown size={12} className={sortField === "date" ? "text-blue-300" : "text-white/40"} />
                      </div>
                    </th>
                    <th className="px-6 py-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-150 text-sm">
                  {filteredAndSortedBookings.map((booking) => {
                    const name = getPatientName(booking);
                    const online = isOnline(booking);
                    const offline = isOffline(booking);
                    const bookingDate = getBookingDate(booking);

                    // Resolve Payment Status Badges
                    const isPaid = online ? true : booking.paid;

                    return (
                      <tr key={booking._id} className="hover:bg-gray-50/50 transition">
                        
                        {/* Profile Info */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            {online && booking.patient?.photo ? (
                              <img
                                src={booking.patient.photo}
                                alt="profile"
                                className="w-10 h-10 rounded-xl object-cover border border-gray-200"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#0c213e] flex items-center justify-center font-bold text-base border border-blue-100">
                                {name.charAt(0).toUpperCase()}
                              </div>
                            )}
                            <div>
                              <p className="font-bold text-gray-900 capitalize">{name}</p>
                              {online && booking.patient?.age ? (
                                <span className="text-xs text-gray-400">
                                  {booking.patient.gender} • {booking.patient.age} Yrs
                                </span>
                              ) : null}
                              {offline && (
                                <span className="text-xs text-gray-400 capitalize">
                                  Walk-in patient (by {booking.bookedBy})
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Booking Context */}
                        <td className="px-6 py-4">
                          {online ? (
                            <span className="inline-flex items-center gap-1 bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold px-2.5 py-1 rounded-lg">
                              <Video className="w-3.5 h-3.5" /> Online
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 bg-purple-50 border border-purple-200 text-purple-700 text-xs font-semibold px-2.5 py-1 rounded-lg">
                              <MapPin className="w-3.5 h-3.5" /> Walk-in
                            </span>
                          )}
                        </td>

                        {/* Token / Mode details */}
                        <td className="px-6 py-4 text-xs font-medium text-gray-700">
                          {online ? (
                            <span className="capitalize">{booking.mode}</span>
                          ) : (
                            <span className="inline-flex items-center gap-1 bg-gray-50 border border-gray-200 text-gray-700 px-2 py-1 rounded-lg">
                              <Hash className="w-3 h-3 text-gray-400" />
                              Token #{booking.tokenNumber}
                            </span>
                          )}
                        </td>

                        {/* Contact details */}
                        <td className="px-6 py-4">
                          {online && booking.patient?.contact ? (
                            <div className="flex items-center gap-1.5 text-xs text-gray-700">
                              <Phone className="w-3.5 h-3.5 text-gray-400" />
                              {booking.patient.contact}
                            </div>
                          ) : (
                            <span className="text-gray-400 text-xs">—</span>
                          )}
                        </td>

                        {/* Fees & Payment badge */}
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-1">
                            <span className="font-semibold text-gray-900">₹{booking.fees}</span>
                            <span className={`inline-flex items-center gap-1 text-[10px] w-fit font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border ${isPaid ? "bg-green-50 text-green-700 border-green-150" : "bg-red-50 text-red-700 border-red-150"}`}>
                              {isPaid ? "Paid" : "Unpaid"}
                            </span>
                          </div>
                        </td>

                        {/* Booking Date */}
                        <td className="px-6 py-4 text-xs font-medium text-gray-700">
                          {bookingDate.toLocaleDateString("en-IN", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric"
                          })}
                        </td>

                        {/* Action buttons */}
                        <td className="px-6 py-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            
                            {online && (
                              <>
                                <button
                                  onClick={() => handleViewEMR(booking.patient?.aadhar, name, booking.patient?.contact)}
                                  className="flex items-center gap-1 px-3 py-1.5 bg-[#0c213e] hover:bg-blue-900 text-white rounded-xl text-xs font-bold transition cursor-pointer"
                                >
                                  EMR
                                </button>
                                <a
                                  href={booking.meetingLink}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="flex items-center gap-1 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-250 rounded-xl text-xs font-bold transition cursor-pointer font-[Poppins]"
                                >
                                  Call
                                </a>
                                <button
                                  onClick={() =>
                                    navigate(`/doctor-chat/${booking.roomId}`, {
                                      state: {
                                        patient: booking.patient,
                                        doctorId: booking.doctorId,
                                        roomId: booking.roomId,
                                      },
                                    })
                                  }
                                  className="flex items-center gap-1 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-250 rounded-xl text-xs font-bold transition cursor-pointer font-[Poppins]"
                                >
                                  Chat
                                </button>
                              </>
                            )}

                            {offline && (
                              <button
                                onClick={() =>
                                  navigate(
                                    `/doctordashboard/${drId}/offline-patient/${booking.userId._id}`,
                                    { state: { booking } }
                                  )
                                }
                                className="flex items-center gap-1.5 px-4 py-1.5 bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200 rounded-xl text-xs font-bold transition cursor-pointer font-[Poppins]"
                              >
                                View Details
                                <ChevronRight className="w-3.5 h-3.5" />
                              </button>
                            )}

                          </div>
                        </td>

                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* Pagination/Registry Footer Count */}
          {!loading && (
            <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex items-center justify-between">
              <span className="text-xs text-gray-400 font-medium">
                Showing {filteredAndSortedBookings.length} of {allBookings.length} patients in records
              </span>
              <span className="text-xs text-gray-400 font-medium">
                Active Doctor context: {drId}
              </span>
            </div>
          )}

        </div>

      </div>

    </main>
  );
}