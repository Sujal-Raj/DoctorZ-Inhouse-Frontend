import React, { useEffect, useState } from "react";
import { IndianRupee, Clock, CheckCircle, RefreshCw, AlertCircle, Sparkles } from "lucide-react";
import api from "../../Services/mainApi";
import toast from "react-hot-toast";

interface PatientCollection {
  _id: string;
  patientName: string;
  doctorName: string;
  fees: number;
  date: string;
  paymentStatus: string;
  paymentMethod: string;
  transactionId: string;
}

interface CollectionStats {
  dailyCollections: number;
  totalPaymentsCollected: number;
  pendingCount: number;
}

const ReceptionistCollections: React.FC = () => {
  const [stats, setStats] = useState<CollectionStats>({
    dailyCollections: 0,
    totalPaymentsCollected: 0,
    pendingCount: 0,
  });
  const [pending, setPending] = useState<PatientCollection[]>([]);
  const [history, setHistory] = useState<PatientCollection[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [selectedBooking, setSelectedBooking] = useState<PatientCollection | null>(null);
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [transactionId, setTransactionId] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchCollections = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("receptionToken");
      const res = await api.get("/api/revenue/receptionist", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setStats(res.data.stats);
        setPending(res.data.pendingPayments);
        setHistory(res.data.paymentHistory);
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to load collections");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCollections();
  }, []);

  const handleOpenPaymentModal = (booking: PatientCollection) => {
    setSelectedBooking(booking);
    setPaymentMethod("cash");
    setTransactionId("");
  };

  const handleClosePaymentModal = () => {
    setSelectedBooking(null);
  };

  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBooking) return;

    setSubmitting(true);
    try {
      const payload = {
        paymentStatus: "paid",
        paymentMethod,
        transactionId: transactionId.trim() || undefined,
      };

      const token = localStorage.getItem("receptionToken");
      const res = await api.put(`/api/revenue/payment/offline/${selectedBooking._id}`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        toast.success("Payment marked as Paid!");
        handleClosePaymentModal();
        fetchCollections();
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to record payment");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <div className="w-10 h-10 border-4 border-[#0c213e] border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-3 text-sm text-gray-500 font-medium">Loading collection ledger...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Collections Panel</h1>
          <p className="text-sm text-gray-500">Log payments for offline check-ins and audit cash/UPI drawer balances</p>
        </div>
        <button
          onClick={fetchCollections}
          className="flex items-center gap-2 px-4 py-2 border border-gray-200 hover:bg-gray-50 rounded-xl transition text-sm font-semibold text-gray-700"
        >
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-[#0c213e] to-[#163a6b] p-6 rounded-2xl text-white shadow-md">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
              <IndianRupee className="w-5 h-5 text-blue-200" />
            </div>
            <span className="text-sm font-medium text-blue-200 uppercase tracking-wide">Today's Drawer</span>
          </div>
          <p className="text-3xl font-extrabold">₹{stats.dailyCollections.toLocaleString("en-IN")}</p>
          <p className="text-xs text-blue-200/80 mt-2">Cash & digital collections received today</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-emerald-600" />
            </div>
            <span className="text-sm font-medium text-gray-500 uppercase tracking-wide">Total Collected</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">₹{stats.totalPaymentsCollected.toLocaleString("en-IN")}</p>
          <p className="text-xs text-gray-400 mt-2">Cumulative offline collections logged</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center">
              <Clock className="w-5 h-5 text-red-600" />
            </div>
            <span className="text-sm font-medium text-gray-500 uppercase tracking-wide">Pending Payments</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">{stats.pendingCount}</p>
          <p className="text-xs text-gray-400 mt-2">Checked-in patients awaiting billing completion</p>
        </div>
      </div>

      {/* Main Grid: Pending list on left, recent history on right */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Pending Payments Table */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
          <div className="px-6 py-5 border-b border-gray-100 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <h2 className="text-lg font-bold text-gray-900">Pending Walk-In Billings</h2>
          </div>
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left text-sm text-gray-700">
              <thead className="bg-gray-50/70 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4">Patient</th>
                  <th className="px-6 py-4">Doctor</th>
                  <th className="px-6 py-4">Consultation Fee</th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {pending.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-10 text-center text-gray-400 italic">
                      All walk-in patients have settled their fees
                    </td>
                  </tr>
                ) : (
                  pending.map((item) => (
                    <tr key={item._id} className="hover:bg-gray-50/50 transition">
                      <td className="px-6 py-4 font-semibold text-gray-900">{item.patientName}</td>
                      <td className="px-6 py-4">{item.doctorName}</td>
                      <td className="px-6 py-4 font-bold text-gray-900">₹{item.fees}</td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleOpenPaymentModal(item)}
                          className="px-3.5 py-1.5 bg-[#0c213e] hover:bg-[#15345c] text-white text-xs font-bold rounded-xl transition cursor-pointer"
                        >
                          Collect
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* History Table */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
          <div className="px-6 py-5 border-b border-gray-100 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-emerald-500" />
            <h2 className="text-lg font-bold text-gray-900">Recent Collections History</h2>
          </div>
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left text-sm text-gray-700">
              <thead className="bg-gray-50/70 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4">Patient</th>
                  <th className="px-6 py-4">Amount</th>
                  <th className="px-6 py-4">Method</th>
                  <th className="px-6 py-4">Receipt/Txn ID</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {history.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-10 text-center text-gray-400 italic">
                      No payments collected today yet
                    </td>
                  </tr>
                ) : (
                  history.slice(0, 8).map((item) => (
                    <tr key={item._id} className="hover:bg-gray-50/50 transition">
                      <td className="px-6 py-4 font-semibold text-gray-900">
                        <div>
                          <p className="font-semibold text-gray-900">{item.patientName}</p>
                          <p className="text-[10px] text-gray-400">Dr. {item.doctorName}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-bold text-gray-900">₹{item.fees}</td>
                      <td className="px-6 py-4">
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold uppercase">
                          {item.paymentMethod}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-mono text-xs text-gray-400">{item.transactionId}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* Collect Payment Modal */}
      {selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="bg-[#0c213e] px-6 py-4 text-white">
              <h3 className="font-bold text-lg">Collect Consultation Fee</h3>
              <p className="text-xs text-blue-200/80">Record receipt details for billing closure</p>
            </div>
            
            <form onSubmit={handleSubmitPayment} className="p-6 space-y-4">
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 space-y-1">
                <p className="text-xs text-gray-400">Patient: <span className="font-semibold text-gray-700">{selectedBooking.patientName}</span></p>
                <p className="text-xs text-gray-400">Doctor: <span className="font-semibold text-gray-700">Dr. {selectedBooking.doctorName}</span></p>
                <p className="text-sm text-gray-700 font-bold mt-1">Consultation Fee: <span className="text-[#0c213e] text-lg">₹{selectedBooking.fees}</span></p>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">
                  Payment Method
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="cash">Cash</option>
                  <option value="upi">UPI / Scanner</option>
                  <option value="card">Debit/Credit Card</option>
                  <option value="netbanking">Net Banking</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">
                  Transaction / Receipt ID <span className="text-gray-300">(Optional)</span>
                </label>
                <input
                  type="text"
                  value={transactionId}
                  onChange={(e) => setTransactionId(e.target.value)}
                  placeholder="e.g. UPI Ref Number, Cash Memo No"
                  className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleClosePaymentModal}
                  className="px-4 py-2 border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 text-sm font-semibold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center gap-2 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white rounded-xl text-sm font-bold shadow transition cursor-pointer"
                >
                  {submitting ? "Saving..." : "Record Payment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReceptionistCollections;
