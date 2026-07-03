import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { DollarSign, Calendar, Users, Star, RefreshCw, Layers, CheckCircle } from "lucide-react";
import api from "../../Services/mainApi";
import toast from "react-hot-toast";

interface Booking {
  _id: string;
  patientName: string;
  fees: number;
  date: string;
  paymentMethod: string;
  transactionId: string;
  type: string;
}

interface EarningStats {
  totalEarnings: number;
  todayEarnings: number;
  weeklyEarnings: number;
  monthlyEarnings: number;
  consultationCount: number;
  averageFee: number;
}

interface Clinic {
  _id: string;
  clinicName: string;
}

const DoctorEarnings: React.FC = () => {
  const { drId } = useParams<{ drId: string }>();
  const [stats, setStats] = useState<EarningStats>({
    totalEarnings: 0,
    todayEarnings: 0,
    weeklyEarnings: 0,
    monthlyEarnings: 0,
    consultationCount: 0,
    averageFee: 0,
  });
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [selectedPractice, setSelectedPractice] = useState("all");
  const [loading, setLoading] = useState(true);

  // Fetch Doctor Clinics
  const fetchDoctorProfile = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await api.get(`/api/doctor/${drId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.doctor) {
        setClinics(res.data.doctor.clinic || []);
      }
    } catch (err) {
      console.error("Error fetching doctor profile:", err);
    }
  };

  // Fetch Earnings based on Practice Filter
  const fetchEarnings = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const query = selectedPractice !== "all" ? `?clinicId=${selectedPractice}` : "";
      const res = await api.get(`/api/revenue/doctor/${drId}${query}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setStats(res.data.stats);
        setBookings(res.data.bookings);
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to load earnings stats");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (drId) {
      fetchDoctorProfile();
    }
  }, [drId]);

  useEffect(() => {
    if (drId) {
      fetchEarnings();
    }
  }, [drId, selectedPractice]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <div className="w-10 h-10 border-4 border-[#0c213e] border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-3 text-sm text-gray-500 font-medium">Reconciling ledger books...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header & Selector */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Earnings Dashboard</h1>
          <p className="text-sm text-gray-500">Analyze your consultation revenues and billing performance metrics</p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Practice Selector:</span>
            <select
              value={selectedPractice}
              onChange={(e) => setSelectedPractice(e.target.value)}
              className="border border-gray-300 rounded-xl px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="all">All Practice Contexts</option>
              <option value="independent">Independent Practice</option>
              {clinics.map((c) => (
                <option key={c._id} value={c._id}>
                  Clinic: {c.clinicName}
                </option>
              ))}
            </select>
          </div>
          
          <button
            onClick={fetchEarnings}
            className="flex items-center justify-center gap-2 px-4 py-2 border border-gray-200 hover:bg-gray-50 rounded-xl transition text-sm font-semibold text-gray-700 cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
        </div>
      </div>

      {/* Stats Summary Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Total Earnings */}
        <div className="bg-gradient-to-br from-[#0c213e] to-[#1d4475] p-6 rounded-2xl text-white shadow-md relative overflow-hidden">
          <div className="absolute right-0 bottom-0 translate-x-3 translate-y-3 opacity-10">
            <DollarSign className="w-36 h-36" />
          </div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 bg-white/10 rounded-xl flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-blue-200" />
            </div>
            <span className="text-xs font-semibold text-blue-200 uppercase tracking-wide">Total Earnings</span>
          </div>
          <p className="text-2xl font-extrabold">₹{stats.totalEarnings.toLocaleString("en-IN")}</p>
          <p className="text-[10px] text-blue-200/80 mt-2">Overall paid consultations revenue</p>
        </div>

        {/* Today's Earnings */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 bg-[#0c213e]/8 rounded-xl flex items-center justify-center">
              <Calendar className="w-5 h-5 text-[#0c213e]" />
            </div>
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Today's Earnings</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">₹{stats.todayEarnings.toLocaleString("en-IN")}</p>
          <p className="text-[10px] text-gray-400 mt-2">Collections logged since midnight</p>
        </div>

        {/* Weekly & Monthly */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 bg-emerald-50 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-emerald-600" strokeWidth={2.5} />
            </div>
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Recent (Weekly/Monthly)</span>
          </div>
          <div className="flex justify-between items-baseline gap-2">
            <div>
              <p className="text-lg font-bold text-gray-900">₹{stats.weeklyEarnings.toLocaleString("en-IN")}</p>
              <p className="text-[8px] text-gray-400">Weekly (7 days)</p>
            </div>
            <div className="border-l border-gray-150 h-8 self-center"></div>
            <div>
              <p className="text-lg font-bold text-gray-900">₹{stats.monthlyEarnings.toLocaleString("en-IN")}</p>
              <p className="text-[8px] text-gray-400">Monthly (30 days)</p>
            </div>
          </div>
        </div>

        {/* Consultations & Averages */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 bg-purple-50 rounded-xl flex items-center justify-center">
              <Users className="w-5 h-5 text-purple-600" />
            </div>
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Volume & Average</span>
          </div>
          <div className="flex justify-between items-baseline gap-2">
            <div>
              <p className="text-lg font-bold text-gray-900">{stats.consultationCount}</p>
              <p className="text-[8px] text-gray-400">Paid Consultations</p>
            </div>
            <div className="border-l border-gray-150 h-8 self-center"></div>
            <div>
              <p className="text-lg font-bold text-gray-900">₹{stats.averageFee}</p>
              <p className="text-[8px] text-gray-400">Average Fee</p>
            </div>
          </div>
        </div>

      </div>

      {/* Transaction table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100 flex items-center gap-2">
          <Layers className="w-5 h-5 text-[#0c213e]" />
          <h2 className="text-lg font-bold text-gray-900">Consultation Transactions Ledger</h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-700">
            <thead className="bg-gray-50/70 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">Patient</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Visit Type</th>
                <th className="px-6 py-4">Fee Charged</th>
                <th className="px-6 py-4">Payment Status</th>
                <th className="px-6 py-4">Method</th>
                <th className="px-6 py-4">Transaction ID</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {bookings.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-10 text-center text-gray-400 italic">
                    No paid consultation transactions found for the selected filter
                  </td>
                </tr>
              ) : (
                bookings.map((booking) => (
                  <tr key={booking._id} className="hover:bg-gray-50/50 transition">
                    <td className="px-6 py-4 font-semibold text-gray-900">{booking.patientName}</td>
                    <td className="px-6 py-4 text-xs text-gray-500">
                      {new Date(booking.date).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
                        booking.type === "online"
                          ? "bg-blue-50 text-blue-700 border-blue-100"
                          : "bg-indigo-50 text-indigo-700 border-indigo-100"
                      }`}>
                        {booking.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-bold text-gray-900">₹{booking.fees}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-100 px-2.5 py-0.5 rounded-full text-xs font-semibold">
                        <CheckCircle className="w-3 h-3 text-emerald-600" /> Paid
                      </span>
                    </td>
                    <td className="px-6 py-4 font-semibold text-xs uppercase text-gray-500">{booking.paymentMethod}</td>
                    <td className="px-6 py-4 font-mono text-xs text-gray-400">{booking.transactionId}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};

export default DoctorEarnings;
