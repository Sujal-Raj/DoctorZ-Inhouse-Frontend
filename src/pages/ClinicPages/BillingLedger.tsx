import React, { useEffect, useState } from "react";
import { useOutletContext, useNavigate } from "react-router-dom";
import api from "../../Services/mainApi";
import toast from "react-hot-toast";
import {
  BanknotesIcon,
  PlusIcon,
  XMarkIcon,
  // ShieldCheckIcon,
  // ArrowPathIcon,
} from "@heroicons/react/24/outline";

interface Patient {
  fullName: string;
  mobileNumber: number;
}

interface Admission {
  bedNumber: string;
}

interface PaymentHistory {
  date: string;
  amount: number;
  method: string;
  transactionId?: string;
}

interface Bill {
  _id: string;
  patientId: Patient;
  admissionId?: Admission;
  invoiceNumber: string;
  grandTotal: number;
  paidAmount: number;
  dueAmount: number;
  status: string;
  insuranceClaimed: boolean;
  insuranceProvider?: string;
  insurancePolicyNumber?: string;
  claimAmount?: number;
  approvedAmount?: number;
  claimStatus?: string;
  paymentHistory?: PaymentHistory[];
}

interface OutletContext {
  clinicId: string;
}

export default function BillingLedger() {
  const { clinicId } = useOutletContext<OutletContext>();
  const navigate = useNavigate();

  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPayModal, setShowPayModal] = useState(false);
  const [showInsModal, setShowInsModal] = useState(false);
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);

  // Form states (Payment)
  const [payAmount, setPayAmount] = useState(0);
  const [payMethod, setPayMethod] = useState("upi");
  const [txnId, setTxnId] = useState("");

  // Form states (Insurance Claim)
  const [appAmount, setAppAmount] = useState(0);
  const [claimStatus, setClaimStatus] = useState("Approved");

  const fetchBills = async () => {
    if (!clinicId) return;
    try {
      setLoading(true);
      const res = await api.get(`/api/billing/list/${clinicId}`);
      if (res.data.success) {
        setBills(res.data.bills);
      }
    } catch {
      toast.error("Failed to load invoice registry");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBills();
  }, [clinicId]);

  const openPay = (bill: Bill) => {
    setSelectedBill(bill);
    setPayAmount(bill.dueAmount);
    setPayMethod("upi");
    setTxnId("");
    setShowPayModal(true);
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBill || payAmount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    try {
      const res = await api.put(`/api/billing/pay/${selectedBill._id}`, {
        amount: payAmount,
        method: payMethod,
        transactionId: txnId,
      });

      if (res.data.success) {
        toast.success("Payment recorded successfully!");
        setShowPayModal(false);
        fetchBills();
      }
    } catch {
      toast.error("Failed to post payment transaction");
    }
  };

  const openInsurance = (bill: Bill) => {
    setSelectedBill(bill);
    setAppAmount(bill.claimAmount || 0);
    setClaimStatus("Approved");
    setShowInsModal(true);
  };

  const handleProcessInsurance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBill) return;

    try {
      const res = await api.put(`/api/billing/insurance/${selectedBill._id}`, {
        approvedAmount: appAmount,
        claimStatus,
      });

      if (res.data.success) {
        toast.success("Insurance claim status updated");
        setShowInsModal(false);
        fetchBills();
      }
    } catch {
      toast.error("Failed to update insurance claim status");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-10 h-10 border-4 border-slate-900 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 w-full font-sans text-gray-900">
      

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-50 rounded-xl">
            <BanknotesIcon className="w-6 h-6 text-[#0c213e]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Billing Ledgers & Invoicing</h1>
            <p className="text-gray-500 text-sm mt-0.5">Generate invoices, record payments, and track insurance claims</p>
          </div>
        </div>
        <button
          onClick={() => navigate(`/clinicDashboard/${clinicId}/invoice-creator`)}
          className="flex items-center gap-2 bg-[#0c213e] hover:bg-[#1a3a5f] text-white px-5 py-2.5 rounded-xl font-bold text-sm cursor-pointer transition-colors"
        >
          <PlusIcon className="w-5 h-5" />
          Create Invoice
        </button>
      </div>

      {/* Ledger list */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
        {bills.length === 0 ? (
          <div className="py-20 text-center text-gray-400">No invoices generated yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-gray-600 font-semibold">
                  <th className="py-4 px-6">Invoice No.</th>
                  <th className="py-4 px-6">Patient</th>
                  <th className="py-4 px-6">Amounts (Grand / Paid / Due)</th>
                  <th className="py-4 px-6">Status</th>
                  <th className="py-4 px-6">Insurance Status</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700">
                {bills.map((bill) => (
                  <tr key={bill._id} className="hover:bg-gray-50/50">
                    <td className="py-4 px-6 font-mono text-xs text-gray-600 font-bold">{bill.invoiceNumber}</td>
                    <td className="py-4 px-6">
                      <h4 className="font-bold text-gray-950 text-sm">{bill.patientId?.fullName}</h4>
                      <span className="text-xs text-gray-400">{bill.patientId?.mobileNumber}</span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex flex-col gap-0.5 text-xs">
                        <span className="font-semibold text-gray-900">Total: ₹{bill.grandTotal.toLocaleString("en-IN")}</span>
                        <span className="text-green-700">Paid: ₹{bill.paidAmount.toLocaleString("en-IN")}</span>
                        <span className="text-red-650">Due: ₹{bill.dueAmount.toLocaleString("en-IN")}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span
                        className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                          bill.status === "Paid"
                            ? "bg-green-50 text-green-700 border-green-200"
                            : bill.status === "Partially Paid"
                            ? "bg-amber-50 text-amber-700 border-amber-200"
                            : "bg-red-50 text-red-650 border-red-200"
                        }`}
                      >
                        {bill.status}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      {bill.insuranceClaimed ? (
                        <div className="flex flex-col gap-0.5 text-xs">
                          <span className="font-semibold text-gray-700">{bill.insuranceProvider}</span>
                          <span
                            className={`inline-flex px-2 py-0.2 w-fit rounded text-[10px] font-bold uppercase ${
                              bill.claimStatus === "Approved"
                                ? "bg-green-50 text-green-700 border border-green-200"
                                : bill.claimStatus === "Rejected"
                                ? "bg-red-50 text-red-700 border border-red-200"
                                : "bg-gray-100 text-gray-700 border border-gray-200"
                            }`}
                          >
                            {bill.claimStatus || "Pending"}
                          </span>
                        </div>
                      ) : (
                        <span className="text-gray-400 text-xs italic">Individual Pay</span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex justify-end gap-2">
                        {bill.dueAmount > 0 && (
                          <button
                            onClick={() => openPay(bill)}
                            className="px-3 py-1.5 bg-[#0c213e] text-white rounded-lg hover:bg-slate-800 cursor-pointer font-bold text-xs"
                          >
                            Record Payment
                          </button>
                        )}
                        {bill.insuranceClaimed && bill.claimStatus === "Pending" && (
                          <button
                            onClick={() => openInsurance(bill)}
                            className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 cursor-pointer font-bold text-xs"
                          >
                            Settle Claim
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Record Payment Modal */}
      {showPayModal && selectedBill && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-55">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm">
            <div className="bg-slate-900 px-6 py-5 flex items-center justify-between text-white rounded-t-3xl">
              <h3 className="text-lg font-bold">Record Payment installment</h3>
              <button onClick={() => setShowPayModal(false)} className="text-gray-400 hover:text-white cursor-pointer">
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleRecordPayment} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-gray-500 mb-1.5">Due Amount: ₹{selectedBill.dueAmount.toLocaleString()}</label>
                <input
                  type="number"
                  required
                  min={1}
                  max={selectedBill.dueAmount}
                  value={payAmount}
                  onChange={(e) => setPayAmount(Number(e.target.value))}
                  className="w-full border-2 border-gray-200 focus:border-[#0c213e] rounded-xl px-4 py-2.5 text-sm outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-gray-500 mb-1.5">Payment Method *</label>
                <select
                  value={payMethod}
                  onChange={(e) => setPayMethod(e.target.value)}
                  className="w-full border-2 border-gray-200 focus:border-[#0c213e] rounded-xl px-4 py-2.5 text-sm outline-none bg-white"
                >
                  <option value="upi">UPI (GPay / PhonePe)</option>
                  <option value="cash">Cash</option>
                  <option value="card">Debit/Credit Card</option>
                  <option value="netbanking">Net Banking</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-gray-500 mb-1.5">Transaction Reference ID</label>
                <input
                  type="text"
                  placeholder="e.g. TXN-1002345"
                  value={txnId}
                  onChange={(e) => setTxnId(e.target.value)}
                  className="w-full border-2 border-gray-200 focus:border-[#0c213e] rounded-xl px-4 py-2.5 text-sm outline-none"
                />
              </div>

              <div className="flex gap-4 border-t border-gray-100 pt-6 mt-6">
                <button
                  type="button"
                  onClick={() => setShowPayModal(false)}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 py-3.5 rounded-xl font-bold text-sm text-gray-700 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-[#0c213e] hover:bg-[#1a3a5f] py-3.5 text-white rounded-xl font-bold text-sm cursor-pointer"
                >
                  Log Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Settle Claim Modal */}
      {showInsModal && selectedBill && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-55">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm">
            <div className="bg-slate-900 px-6 py-5 flex items-center justify-between text-white rounded-t-3xl">
              <h3 className="text-lg font-bold">Settle Insurance Claim</h3>
              <button onClick={() => setShowInsModal(false)} className="text-gray-400 hover:text-white cursor-pointer">
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleProcessInsurance} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-gray-500 mb-1.5">Claim Status Decision *</label>
                <select
                  value={claimStatus}
                  onChange={(e) => setClaimStatus(e.target.value)}
                  className="w-full border-2 border-gray-200 focus:border-[#0c213e] rounded-xl px-4 py-2.5 text-sm outline-none bg-white"
                >
                  <option value="Approved">Claim Approved</option>
                  <option value="Rejected">Claim Rejected</option>
                </select>
              </div>

              {claimStatus === "Approved" && (
                <div>
                  <label className="block text-xs font-bold uppercase text-gray-500 mb-1.5">Approved Amount (₹) *</label>
                  <input
                    type="number"
                    required
                    max={selectedBill.claimAmount}
                    value={appAmount}
                    onChange={(e) => setAppAmount(Number(e.target.value))}
                    className="w-full border-2 border-gray-200 focus:border-[#0c213e] rounded-xl px-4 py-2.5 text-sm outline-none"
                  />
                </div>
              )}

              <div className="flex gap-4 border-t border-gray-100 pt-6 mt-6">
                <button
                  type="button"
                  onClick={() => setShowInsModal(false)}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 py-3.5 rounded-xl font-bold text-sm text-gray-700 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-[#0c213e] hover:bg-[#1a3a5f] py-3.5 text-white rounded-xl font-bold text-sm cursor-pointer"
                >
                  Post Status
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
