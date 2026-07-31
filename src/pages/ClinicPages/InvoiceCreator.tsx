import React, { useEffect, useState } from "react";
import { useOutletContext, useNavigate } from "react-router-dom";
import api from "../../Services/mainApi";
import toast from "react-hot-toast";
import {
  ArrowLeftIcon,
  TrashIcon,
  PlusIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";

interface InventoryItem {
  _id: string;
  itemName: string;
  price: number;
  quantity: number;
}

interface Patient {
  _id: string;
  fullName: string;
  mobileNumber: number;
}

interface Ward {
  name: string;
  chargePerDay: number;
}

interface Admission {
  _id: string;
  patientId: Patient;
  wardId: Ward;
  bedNumber: string;
  admissionDate: string;
  status: string;
}

interface BillItemInput {
  name: string;
  quantity: number;
  unitPrice: number;
  inventoryItemId?: string;
}

interface OutletContext {
  clinicId: string;
}

export default function InvoiceCreator() {
  const { clinicId } = useOutletContext<OutletContext>();
  const navigate = useNavigate();

  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [admissions, setAdmissions] = useState<Admission[]>([]);
  const [patientSuggestions, setPatientSuggestions] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [searchMobile, setSearchMobile] = useState("");

  // Linked admission stay
  const [selectedAdmission, setSelectedAdmission] = useState<Admission | null>(null);

  // Invoice parameters
  const [items, setItems] = useState<BillItemInput[]>([
    { name: "", quantity: 1, unitPrice: 0 }
  ]);
  const [tax, setTax] = useState(0);
  const [discount, setDiscount] = useState(0);

  // Insurance parameters
  const [insClaimed, setInsClaimed] = useState(false);
  const [insProvider, setInsProvider] = useState("");
  const [insPolicy, setInsPolicy] = useState("");
  const [claimAmt, setClaimAmt] = useState(0);

  const [submitting, setSubmitting] = useState(false);

  const fetchBaseData = async () => {
    if (!clinicId) return;
    try {
      const [invRes, admRes] = await Promise.all([
        api.get(`/api/inventory/clinic/${clinicId}`),
        api.get(`/api/ipd/admissions/${clinicId}`),
      ]);

      if (invRes.data.success) setInventory(invRes.data.inventory || []);
      if (admRes.data.success) setAdmissions(admRes.data.admissions || []);
    } catch {
      toast.error("Failed to load inventory assets");
    }
  };

  useEffect(() => {
    fetchBaseData();
  }, [clinicId]);

  const handlePatientSearch = async (mobile: string) => {
    setSearchMobile(mobile);
    if (mobile.length < 3) {
      setPatientSuggestions([]);
      return;
    }
    try {
      const token = localStorage.getItem("clinicToken") || localStorage.getItem("receptionToken") || localStorage.getItem("doctorToken") || localStorage.getItem("clinic_portal_token");
      const res = await api.get(`/api/receptionist/search-patient/${mobile}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success && Array.isArray(res.data.patients)) {
        setPatientSuggestions(res.data.patients);
      }
    } catch {
      // Fail silently
    }
  };

  const handleSelectPatient = (p: Patient) => {
    setSelectedPatient(p);
    setSearchMobile(p.fullName);
    setPatientSuggestions([]);
    
    // Check if they have an active IPD stay
    const patientStay = admissions.find((a) => a.patientId?._id === p._id && a.status === "Admitted");
    if (patientStay) {
      setSelectedAdmission(patientStay);
      
      // Auto-calculate room stay duration charges
      const start = new Date(patientStay.admissionDate);
      const today = new Date();
      const diffTime = Math.abs(today.getTime() - start.getTime());
      const diffDays = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24))); // Minimum 1 day
      const charge = patientStay.wardId?.chargePerDay || 0;

      // Inject ward charges as row item
      setItems([
        {
          name: `${patientStay.wardId?.name} stay - Bed ${patientStay.bedNumber} (${diffDays} days)`,
          quantity: diffDays,
          unitPrice: charge,
        }
      ]);
    } else {
      setSelectedAdmission(null);
      setItems([{ name: "", quantity: 1, unitPrice: 0 }]);
    }
  };

  const handleAddItemRow = () => {
    setItems((prev) => [...prev, { name: "", quantity: 1, unitPrice: 0 }]);
  };

  const handleRemoveItemRow = (idx: number) => {
    if (items.length === 1) return;
    setItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleItemChange = (idx: number, field: keyof BillItemInput, value: any) => {
    setItems((prev) =>
      prev.map((item, i) => {
        if (i !== idx) return item;
        const updated = { ...item, [field]: value };
        
        // If selecting from inventory item
        if (field === "inventoryItemId" && value) {
          const invItem = inventory.find((inv) => inv._id === value);
          if (invItem) {
            updated.name = invItem.itemName;
            updated.unitPrice = invItem.price;
          }
        }
        return updated;
      })
    );
  };

  const getSubtotal = () => {
    return items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
  };

  const getGrandTotal = () => {
    return getSubtotal() + tax - discount;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatient) {
      toast.error("Please select a patient first.");
      return;
    }

    const invalid = items.some((item) => !item.name || item.quantity <= 0 || item.unitPrice < 0);
    if (invalid) {
      toast.error("Please fill in item details correctly.");
      return;
    }

    try {
      setSubmitting(true);
      const res = await api.post("/api/billing/add", {
        clinicId,
        patientId: selectedPatient._id,
        admissionId: selectedAdmission?._id || undefined,
        items,
        tax,
        discount,
        insuranceClaimed: insClaimed,
        insuranceProvider: insClaimed ? insProvider : undefined,
        insurancePolicyNumber: insClaimed ? insPolicy : undefined,
        claimAmount: insClaimed ? claimAmt : undefined,
      });

      if (res.data.success) {
        toast.success("Invoice generated! Stock updated.");
        navigate(`/clinicDashboard/${clinicId}/billing-ledger`);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to create invoice");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6 space-y-6 w-full font-sans text-gray-900">
      

      {/* Back button */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-gray-500 hover:text-gray-900 font-semibold text-sm cursor-pointer"
      >
        <ArrowLeftIcon className="w-4 h-4" />
        Back to Ledger
      </button>

      <div>
        <h1 className="text-2xl font-bold text-gray-900">Generate Invoice</h1>
        <p className="text-sm text-gray-500 mt-1">
          Compute consultation, stay charges, inventory medicines, and map insurance claimed parameters
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 bg-white border border-gray-150 p-6 rounded-2xl shadow-2xs">
        
        {/* Patient Selection Search */}
        <div className="relative">
          <label className="block text-xs font-bold uppercase text-gray-500 mb-1.5">Lookup Patient *</label>
          <div className="relative">
            <input
              type="text"
              required
              placeholder="Search patient by name or mobile number"
              value={searchMobile}
              onChange={(e) => handlePatientSearch(e.target.value)}
              className="w-full border-2 border-gray-200 focus:border-[#0c213e] rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none bg-gray-50/50"
            />
            <MagnifyingGlassIcon className="w-5 h-5 text-gray-400 absolute left-3 top-3.5" />
          </div>

          {patientSuggestions.length > 0 && (
            <div className="absolute z-10 w-full bg-white border border-gray-200 rounded-xl shadow-lg mt-1 max-h-48 overflow-y-auto divide-y divide-gray-100">
              {patientSuggestions.map((p) => (
                <div
                  key={p._id}
                  onClick={() => handleSelectPatient(p)}
                  className="px-4 py-2.5 hover:bg-gray-50 cursor-pointer flex justify-between items-center text-sm font-semibold"
                >
                  <span>{p.fullName}</span>
                  <span className="text-xs text-gray-400">{p.mobileNumber}</span>
                </div>
              ))}
            </div>
          )}

          {selectedPatient && (
            <div className="mt-2 bg-blue-50 border border-blue-200 rounded-xl px-4 py-2.5 text-xs text-blue-800 font-semibold flex items-center justify-between">
              <span>Patient Target: {selectedPatient.fullName} ({selectedPatient.mobileNumber})</span>
              {selectedAdmission && (
                <span className="text-amber-700">Linked to active IPD bed stay ({selectedAdmission.bedNumber})</span>
              )}
            </div>
          )}
        </div>

        {/* Invoicing Line items */}
        <div className="space-y-3">
          <span className="block text-xs font-bold uppercase text-gray-400 tracking-wider">Line Items</span>
          
          {items.map((item, idx) => (
            <div key={idx} className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center border border-gray-100 p-4 rounded-2xl bg-gray-50/50">
              
              {/* Inventory select dropdown */}
              <div className="sm:col-span-3">
                <label className="block text-[9px] font-bold uppercase text-gray-400 mb-1">Select Asset</label>
                <select
                  value={item.inventoryItemId || ""}
                  onChange={(e) => handleItemChange(idx, "inventoryItemId", e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-2.5 py-2 text-xs outline-none bg-white font-medium"
                >
                  <option value="">Custom Item</option>
                  {inventory.map((inv) => (
                    <option key={inv._id} value={inv._id} disabled={inv.quantity <= 0}>
                      {inv.itemName} (Price: ₹{inv.price} • Stock: {inv.quantity})
                    </option>
                  ))}
                </select>
              </div>

              {/* Item Name */}
              <div className="sm:col-span-4">
                <label className="block text-[9px] font-bold uppercase text-gray-400 mb-1">Item Description</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Syringe / Stay Fee"
                  value={item.name}
                  onChange={(e) => handleItemChange(idx, "name", e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs outline-none bg-white font-semibold text-gray-800"
                />
              </div>

              {/* Quantity */}
              <div className="sm:col-span-2">
                <label className="block text-[9px] font-bold uppercase text-gray-400 mb-1">Qty</label>
                <input
                  type="number"
                  min={1}
                  required
                  value={item.quantity}
                  onChange={(e) => handleItemChange(idx, "quantity", Number(e.target.value))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs outline-none bg-white text-center font-bold"
                />
              </div>

              {/* Unit Price */}
              <div className="sm:col-span-2">
                <label className="block text-[9px] font-bold uppercase text-gray-400 mb-1">Price (₹)</label>
                <input
                  type="number"
                  required
                  value={item.unitPrice}
                  onChange={(e) => handleItemChange(idx, "unitPrice", Number(e.target.value))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs outline-none bg-white text-center font-bold"
                />
              </div>

              {/* Actions */}
              <div className="sm:col-span-1 flex justify-center mt-3 sm:mt-0">
                <button
                  type="button"
                  onClick={() => handleRemoveItemRow(idx)}
                  className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
                  title="Remove Row"
                >
                  <TrashIcon className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))}

          <button
            type="button"
            onClick={handleAddItemRow}
            className="flex items-center gap-1.5 text-blue-600 hover:text-blue-700 font-bold text-xs cursor-pointer mt-1.5"
          >
            <PlusIcon className="w-4 h-4" />
            Add Row
          </button>
        </div>

        <hr className="border-gray-150" />

        {/* Pricing calculations */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
          
          {/* Left: Insurance */}
          <div className="space-y-4">
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={insClaimed}
                onChange={() => setInsClaimed(!insClaimed)}
                className="rounded border-gray-300 text-[#0c213e] focus:ring-0 w-4 h-4 cursor-pointer"
              />
              File Insurance Claim
            </label>

            {insClaimed && (
              <div className="bg-gray-50 border border-gray-150 p-4 rounded-2xl grid grid-cols-2 gap-3 text-xs">
                <div className="col-span-2">
                  <label className="block text-[10px] font-bold uppercase text-gray-400 mb-1">Insurance Provider</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Star Health, LIC"
                    value={insProvider}
                    onChange={(e) => setInsProvider(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 outline-none bg-white font-semibold text-gray-800"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-gray-400 mb-1">Policy Number</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. POL-10023"
                    value={insPolicy}
                    onChange={(e) => setInsPolicy(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 outline-none bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-gray-400 mb-1">Claim Amount (₹)</label>
                  <input
                    type="number"
                    required
                    max={getGrandTotal()}
                    value={claimAmt}
                    onChange={(e) => setClaimAmt(Number(e.target.value))}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 outline-none bg-white"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Right: Calculations */}
          <div className="bg-gray-50 border border-gray-150 p-6 rounded-2xl space-y-3.5 text-xs text-gray-700">
            <div className="flex justify-between items-center font-semibold">
              <span>Subtotal:</span>
              <span className="text-gray-900">₹{getSubtotal().toLocaleString("en-IN")}</span>
            </div>

            <div className="flex justify-between items-center">
              <span>Taxes / Surcharges (₹):</span>
              <input
                type="number"
                value={tax}
                onChange={(e) => setTax(Number(e.target.value))}
                className="w-24 text-right border border-gray-200 rounded-lg px-2 py-1 outline-none bg-white font-bold text-gray-900"
              />
            </div>

            <div className="flex justify-between items-center">
              <span>Discount (₹):</span>
              <input
                type="number"
                value={discount}
                onChange={(e) => setDiscount(Number(e.target.value))}
                className="w-24 text-right border border-gray-200 rounded-lg px-2 py-1 outline-none bg-white font-bold text-gray-900"
              />
            </div>

            <div className="flex justify-between items-center font-bold text-sm border-t border-gray-200 pt-3 text-slate-950">
              <span>Grand Total:</span>
              <span>₹{getGrandTotal().toLocaleString("en-IN")}</span>
            </div>
          </div>

        </div>

        {/* Submit */}
        <div className="flex gap-4 border-t border-gray-100 pt-6">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex-1 bg-gray-100 hover:bg-gray-250 py-3.5 rounded-xl font-bold text-sm text-gray-700 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="flex-1 bg-[#0c213e] hover:bg-[#1a3a5f] py-3.5 text-white rounded-xl font-bold text-sm transition-colors cursor-pointer"
          >
            {submitting ? "Generating Invoice..." : "Create Invoice"}
          </button>
        </div>

      </form>
    </div>
  );
}
