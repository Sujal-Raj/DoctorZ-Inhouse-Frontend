import React, { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import {  Calendar, RefreshCw, Clipboard,  CheckCircle, IndianRupee, TrendingUp, Users } from "lucide-react";
import api from "../../Services/mainApi";
import toast from "react-hot-toast";

interface Booking {
  _id: string;
  patientName: string;
  itemName: string;
  amount: number;
  date: string;
  paymentMethod: string;
  transactionId: string;
  type: string;
}

interface EarningStats {
  totalRevenue: number;
  todayRevenue: number;
  weeklyRevenue: number;
  monthlyRevenue: number;
  testCount: number;
  averageBill: number;
}

interface LabDashboardContext {
  labId: string | null;
}

const LabRevenue: React.FC = () => {
  const { labId } = useOutletContext<LabDashboardContext>();
  const [stats, setStats] = useState<EarningStats>({
    totalRevenue: 0,
    todayRevenue: 0,
    weeklyRevenue: 0,
    monthlyRevenue: 0,
    testCount: 0,
    averageBill: 0,
  });
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRevenue = async () => {
    if (!labId) return;
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await api.get(`/api/revenue/lab/${labId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setStats(res.data.stats);
        setBookings(res.data.bookings);
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to load lab revenue statistics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRevenue();
  }, [labId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <div className="w-10 h-10 border-4 border-[#0c213e] border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-3 text-sm text-gray-500 font-medium">Summing billing journals...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Lab Revenue Dashboard</h1>
          <p className="text-sm text-gray-500">Track paid diagnostics tests and billing summaries</p>
        </div>
        
        <button
          onClick={fetchRevenue}
          className="flex items-center justify-center gap-2 px-4 py-2 border border-gray-200 hover:bg-gray-50 rounded-xl transition text-sm font-semibold text-gray-700 cursor-pointer w-full md:w-auto"
        >
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {/* Stats Summary Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Total Lab Earnings */}
        <div className="bg-gradient-to-br from-[#0c213e] to-[#1a3d69] p-6 rounded-2xl text-white shadow-md relative overflow-hidden">
          <div className="absolute right-0 bottom-0 translate-x-3 translate-y-3 opacity-10">
            <IndianRupee className="w-36 h-36" />
          </div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 bg-white/10 rounded-xl flex items-center justify-center">
              <IndianRupee className="w-5 h-5 text-blue-200" />
            </div>
            <span className="text-xs font-semibold text-blue-200 uppercase tracking-wide">Total Earnings</span>
          </div>
          <p className="text-2xl font-extrabold">₹{stats.totalRevenue.toLocaleString("en-IN")}</p>
          <p className="text-[10px] text-blue-200/80 mt-2">Overall paid lab bookings revenue</p>
        </div>

        {/* Today's Earnings */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 bg-[#0c213e]/8 rounded-xl flex items-center justify-center">
              <Calendar className="w-5 h-5 text-[#0c213e]" />
            </div>
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Today's Earnings</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">₹{stats.todayRevenue.toLocaleString("en-IN")}</p>
          <p className="text-[10px] text-gray-400 mt-2">Collections completed today</p>
        </div>

        {/* Weekly & Monthly */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 bg-emerald-50 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
            </div>
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Recent Revenue</span>
          </div>
          <div className="flex justify-between items-baseline gap-2">
            <div>
              <p className="text-lg font-bold text-gray-900">₹{stats.weeklyRevenue.toLocaleString("en-IN")}</p>
              <p className="text-[8px] text-gray-400">Weekly (7 days)</p>
            </div>
            <div className="border-l border-gray-150 h-8 self-center"></div>
            <div>
              <p className="text-lg font-bold text-gray-900">₹{stats.monthlyRevenue.toLocaleString("en-IN")}</p>
              <p className="text-[8px] text-gray-400">Monthly (30 days)</p>
            </div>
          </div>
        </div>

        {/* Volume & Average Bill */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 bg-purple-50 rounded-xl flex items-center justify-center">
              <Users className="w-5 h-5 text-purple-600" />
            </div>
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Volume & Average</span>
          </div>
          <div className="flex justify-between items-baseline gap-2">
            <div>
              <p className="text-lg font-bold text-gray-900">{stats.testCount}</p>
              <p className="text-[8px] text-gray-400">Tests Completed</p>
            </div>
            <div className="border-l border-gray-150 h-8 self-center"></div>
            <div>
              <p className="text-lg font-bold text-gray-900">₹{stats.averageBill}</p>
              <p className="text-[8px] text-gray-400">Average Bill</p>
            </div>
          </div>
        </div>

      </div>

      {/* Ledger Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100 flex items-center gap-2">
          <Clipboard className="w-5 h-5 text-[#0c213e]" />
          <h2 className="text-lg font-bold text-gray-900">Lab Settlements Ledger</h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-700">
            <thead className="bg-gray-50/70 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">Patient</th>
                <th className="px-6 py-4">Test/Package Booked</th>
                <th className="px-6 py-4">Booking Date</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4">Fee Charged</th>
                <th className="px-6 py-4">Payment Status</th>
                <th className="px-6 py-4">Method</th>
                <th className="px-6 py-4">Transaction Reference</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {bookings.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-10 text-center text-gray-400 italic">
                    No paid transaction settlements found
                  </td>
                </tr>
              ) : (
                bookings.map((booking) => (
                  <tr key={booking._id} className="hover:bg-gray-50/50 transition">
                    <td className="px-6 py-4 font-semibold text-gray-900">{booking.patientName}</td>
                    <td className="px-6 py-4 font-medium text-gray-700">{booking.itemName}</td>
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
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
                        booking.type === "package"
                          ? "bg-amber-50 text-amber-700 border-amber-100"
                          : "bg-blue-50 text-blue-700 border-blue-100"
                      }`}>
                        {booking.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-bold text-gray-900">₹{booking.amount}</td>
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

export default LabRevenue;
