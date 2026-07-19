import React, { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import api from "../../Services/mainApi";
import toast from "react-hot-toast";
import {
  UsersIcon,
  PlusIcon,
  XMarkIcon,
  CreditCardIcon,
  // ChevronDownIcon,
} from "@heroicons/react/24/outline";

interface PurchaseLog {
  _id?: string;
  date: string;
  itemName: string;
  quantity: number;
  totalCost: number;
  paidAmount: number;
}

interface Supplier {
  _id: string;
  name: string;
  contactPerson?: string;
  mobile?: string;
  balanceDue: number;
  purchaseHistory: PurchaseLog[];
}

interface OutletContext {
  clinicId: string;
}

export default function SupplierManagement() {
  const { clinicId } = useOutletContext<OutletContext>();

  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showSettleModal, setShowSettleModal] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);

  // Form states (Add Supplier)
  const [name, setName] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [mobile, setMobile] = useState("");

  // Form states (Settle Balance)
  const [settleAmount, setSettleAmount] = useState(0);
  const [settleMethod, setSettleMethod] = useState("UPI");

  const fetchSuppliers = async () => {
    if (!clinicId) return;
    try {
      setLoading(true);
      const res = await api.get(`/api/asset-supplier/suppliers/${clinicId}`);
      if (res.data.success) {
        setSuppliers(res.data.suppliers);
      }
    } catch {
      toast.error("Failed to load medical suppliers list");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, [clinicId]);

  const handleAddSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) {
      toast.error("Supplier name is required");
      return;
    }

    try {
      const res = await api.post("/api/asset-supplier/suppliers/add", {
        clinicId,
        name,
        contactPerson: contactPerson || undefined,
        mobile: mobile || undefined,
      });

      if (res.data.success) {
        toast.success("Supplier registered successfully!");
        setShowAddModal(false);
        setName("");
        setContactPerson("");
        setMobile("");
        fetchSuppliers();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to register supplier");
    }
  };

  const openSettle = (sup: Supplier) => {
    setSelectedSupplier(sup);
    setSettleAmount(sup.balanceDue);
    setSettleMethod("UPI");
    setShowSettleModal(true);
  };

  const handleSettleBalance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSupplier || settleAmount <= 0) {
      toast.error("Please enter a valid payout amount");
      return;
    }

    try {
      const res = await api.post(`/api/asset-supplier/suppliers/settle/${selectedSupplier._id}`, {
        amount: settleAmount,
        method: settleMethod,
      });

      if (res.data.success) {
        toast.success("Supplier balance paid off and expense ledger updated!");
        setShowSettleModal(false);
        fetchSuppliers();
      }
    } catch {
      toast.error("Failed to settle supplier balance");
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
    <div className="p-6 space-y-6 max-w-7xl mx-auto font-sans text-gray-900">
      

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-50 rounded-xl">
            <UsersIcon className="w-6 h-6 text-[#0c213e]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Supplier Ledgers & Balances</h1>
            <p className="text-gray-500 text-sm mt-0.5">Manage distributor balances, restock transactions, and settlements</p>
          </div>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-[#0c213e] hover:bg-[#1a3a5f] text-white px-5 py-2.5 rounded-xl font-bold text-sm cursor-pointer transition-colors"
        >
          <PlusIcon className="w-5 h-5" />
          Add Supplier
        </button>
      </div>

      {/* Suppliers directory */}
      {suppliers.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-20 text-center text-gray-400">
          No medical distributors onboarded. Onboard a supplier to manage purchase accounts.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {suppliers.map((sup) => (
            <div key={sup._id} className="bg-white border border-gray-150 rounded-2xl p-6 shadow-2xs space-y-4">
              
              {/* Upper row */}
              <div className="flex justify-between items-start border-b border-gray-100 pb-3">
                <div>
                  <h3 className="font-bold text-base text-gray-900">{sup.name}</h3>
                  <p className="text-xs text-gray-450 mt-0.5">
                    Contact: {sup.contactPerson || "Not specified"} • Mobile: {sup.mobile || "N/A"}
                  </p>
                </div>
                
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-gray-400 block tracking-wider">Balance Due</span>
                  <span className={`text-base font-bold ${sup.balanceDue > 0 ? "text-red-650" : "text-green-700"}`}>
                    ₹{sup.balanceDue.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Settle button */}
              {sup.balanceDue > 0 && (
                <button
                  onClick={() => openSettle(sup)}
                  className="w-full flex items-center justify-center gap-2 bg-blue-50 hover:bg-blue-100/80 text-blue-700 font-bold text-xs py-2.5 rounded-xl transition-colors cursor-pointer border border-blue-100"
                >
                  <CreditCardIcon className="w-4 h-4" />
                  Settle Balance
                </button>
              )}

              {/* Purchase log list */}
              <div className="space-y-2">
                <span className="block text-xs font-bold text-gray-700 border-b border-gray-100 pb-1.5">
                  Distributions & Restock Purchases ({sup.purchaseHistory.length})
                </span>

                {sup.purchaseHistory.length === 0 ? (
                  <p className="text-[11px] text-gray-400 italic">No restocking logs recorded from this supplier.</p>
                ) : (
                  <div className="max-h-28 overflow-y-auto space-y-1.5 divide-y divide-gray-100 pr-1">
                    {sup.purchaseHistory.map((log, idx) => (
                      <div key={idx} className="pt-1.5 flex justify-between text-[11px] text-gray-650">
                        <div>
                          <p className="font-semibold text-gray-800">{log.itemName} (x{log.quantity})</p>
                          <span className="text-gray-450 text-[10px]">Restocked on {new Date(log.date).toLocaleDateString()}</span>
                        </div>
                        <div className="text-right font-medium">
                          <p className="text-gray-900 font-bold">₹{log.totalCost.toLocaleString()}</p>
                          <span className="text-[9px] text-green-700 font-semibold">Paid: ₹{log.paidAmount.toLocaleString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          ))}
        </div>
      )}

      {/* Add Supplier Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-55">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm">
            <div className="bg-slate-900 px-6 py-5 flex items-center justify-between text-white rounded-t-3xl">
              <h3 className="text-lg font-bold">Register Supplier</h3>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-white cursor-pointer">
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleAddSupplier} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-gray-500 mb-1.5">Supplier / Agency Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Apex Biotech Ltd."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full border-2 border-gray-200 focus:border-[#0c213e] rounded-xl px-4 py-2.5 text-sm outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-gray-500 mb-1.5">Contact Person Name</label>
                <input
                  type="text"
                  placeholder="e.g. Mr. Anil Sharma"
                  value={contactPerson}
                  onChange={(e) => setContactPerson(e.target.value)}
                  className="w-full border-2 border-gray-200 focus:border-[#0c213e] rounded-xl px-4 py-2.5 text-sm outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-gray-500 mb-1.5">Mobile Number</label>
                <input
                  type="tel"
                  placeholder="e.g. 9876543210"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  className="w-full border-2 border-gray-200 focus:border-[#0c213e] rounded-xl px-4 py-2.5 text-sm outline-none"
                />
              </div>

              <div className="flex gap-4 border-t border-gray-100 pt-6 mt-6">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 py-3.5 rounded-xl font-bold text-sm text-gray-700 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-[#0c213e] hover:bg-[#1a3a5f] py-3.5 text-white rounded-xl font-bold text-sm cursor-pointer"
                >
                  Register
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Settle Balance Modal */}
      {showSettleModal && selectedSupplier && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-55">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm">
            <div className="bg-slate-900 px-6 py-5 flex items-center justify-between text-white rounded-t-3xl">
              <h3 className="text-lg font-bold">Pay Supplier: {selectedSupplier.name}</h3>
              <button onClick={() => setShowSettleModal(false)} className="text-gray-400 hover:text-white cursor-pointer">
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSettleBalance} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-gray-500 mb-1.5">Outstanding Balance: ₹{selectedSupplier.balanceDue.toLocaleString()}</label>
                <input
                  type="number"
                  required
                  min={1}
                  max={selectedSupplier.balanceDue}
                  value={settleAmount}
                  onChange={(e) => setSettleAmount(Number(e.target.value))}
                  className="w-full border-2 border-gray-200 focus:border-[#0c213e] rounded-xl px-4 py-2.5 text-sm outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-gray-500 mb-1.5">Payment Method *</label>
                <select
                  value={settleMethod}
                  onChange={(e) => setSettleMethod(e.target.value)}
                  className="w-full border-2 border-gray-200 focus:border-[#0c213e] rounded-xl px-4 py-2.5 text-sm outline-none bg-white"
                >
                  <option value="UPI">UPI (GPay / NetBanking)</option>
                  <option value="Cash">Cash</option>
                  <option value="Card">Card</option>
                  <option value="Bank Transfer">Direct Bank Transfer</option>
                </select>
              </div>

              <div className="flex gap-4 border-t border-gray-100 pt-6 mt-6">
                <button
                  type="button"
                  onClick={() => setShowSettleModal(false)}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 py-3.5 rounded-xl font-bold text-sm text-gray-700 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-[#0c213e] hover:bg-[#1a3a5f] py-3.5 text-white rounded-xl font-bold text-sm cursor-pointer"
                >
                  Record Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
