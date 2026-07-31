import React, { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import api from "../../Services/mainApi";
import toast from "react-hot-toast";
import {
  BuildingOfficeIcon,
  PlusIcon,
  XMarkIcon,
  WrenchIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";

interface Bed {
  _id: string;
  bedNumber: string;
  status: "Available" | "Occupied" | "Cleaning" | "Maintenance";
}

interface Ward {
  _id: string;
  name: string;
  type: string;
  chargePerDay: number;
  beds: Bed[];
}

interface OutletContext {
  clinicId: string;
}

export default function WardManagement() {
  const { clinicId } = useOutletContext<OutletContext>();
  const [wards, setWards] = useState<Ward[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // Form states
  const [name, setName] = useState("");
  const [type, setType] = useState("General");
  const [chargePerDay, setChargePerDay] = useState(1000);
  const [bedCount, setBedCount] = useState(5);

  const wardTypes = ["General", "Semi-Private", "Private", "ICU", "Deluxe"];

  const fetchWards = async () => {
    if (!clinicId) return;
    try {
      setLoading(true);
      const res = await api.get(`/api/ipd/wards/${clinicId}`);
      if (res.data.success) {
        setWards(res.data.wards);
      }
    } catch {
      toast.error("Failed to load hospital wards schema");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWards();
  }, [clinicId]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) {
      toast.error("Ward name is required");
      return;
    }

    try {
      const res = await api.post("/api/ipd/wards/add", {
        clinicId,
        name,
        type,
        chargePerDay,
        bedCount,
      });

      if (res.data.success) {
        toast.success("Ward and beds setup successfully!");
        setShowModal(false);
        setName("");
        setBedCount(5);
        fetchWards();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to create ward");
    }
  };

  const handleBedStatus = async (wardId: string, bedId: string, status: string) => {
    try {
      const res = await api.put(`/api/ipd/wards/bed-status/${wardId}/${bedId}`, { status });
      if (res.data.success) {
        toast.success(`Bed set to ${status.toLowerCase()}`);
        fetchWards();
      }
    } catch {
      toast.error("Failed to update bed status");
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
            <BuildingOfficeIcon className="w-6 h-6 text-[#0c213e]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Wards & Bed Configurations</h1>
            <p className="text-gray-500 text-sm mt-0.5">Configure clinical admission rooms, prices, and bed availability rosters</p>
          </div>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-[#0c213e] hover:bg-[#1a3a5f] text-white px-5 py-2.5 rounded-xl font-bold text-sm cursor-pointer transition-colors"
        >
          <PlusIcon className="w-5 h-5" />
          Add Ward
        </button>
      </div>

      {/* Wards list */}
      {wards.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-20 text-center text-gray-400">
          No hospital wards configured. Add a ward to set up beds.
        </div>
      ) : (
        <div className="space-y-8">
          {wards.map((ward) => (
            <div key={ward._id} className="bg-white rounded-2xl border border-gray-150 p-6 space-y-4 shadow-2xs">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-gray-100 pb-4">
                <div>
                  <h3 className="text-lg font-bold text-[#0c213e]">{ward.name}</h3>
                  <div className="flex gap-2 mt-1">
                    <span className="inline-flex px-2 py-0.5 bg-blue-50 text-blue-700 rounded-md text-[10px] font-bold uppercase tracking-wider border border-blue-100">
                      {ward.type} Ward
                    </span>
                    <span className="inline-flex px-2 py-0.5 bg-gray-50 text-gray-700 rounded-md text-[10px] font-bold border border-gray-150">
                      ₹{ward.chargePerDay.toLocaleString("en-IN")}/day
                    </span>
                  </div>
                </div>

                <div className="flex text-xs font-semibold gap-3 text-gray-500 bg-gray-50 px-4 py-2 rounded-xl border border-gray-100">
                  <span>Beds: {ward.beds.length}</span>
                  <span>|</span>
                  <span className="text-green-700">Available: {ward.beds.filter(b => b.status === "Available").length}</span>
                </div>
              </div>

              {/* Beds Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-4">
                {ward.beds.map((bed) => (
                  <div
                    key={bed._id}
                    className={`border-2 rounded-2xl p-4 flex flex-col items-center justify-between text-center transition-all ${
                      bed.status === "Available"
                        ? "border-green-150 bg-green-50/20 hover:bg-green-50/40"
                        : bed.status === "Occupied"
                        ? "border-red-150 bg-red-50/20"
                        : bed.status === "Cleaning"
                        ? "border-blue-150 bg-blue-50/20"
                        : "border-gray-200 bg-gray-50"
                    }`}
                  >
                    <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Bed</span>
                    <h4 className="text-base font-bold text-gray-900 my-1">{bed.bedNumber}</h4>
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full ${
                        bed.status === "Available"
                          ? "bg-green-100 text-green-700"
                          : bed.status === "Occupied"
                          ? "bg-red-100 text-red-700"
                          : bed.status === "Cleaning"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {bed.status}
                    </span>

                    {/* Bed actions */}
                    <div className="flex gap-1.5 mt-3 pt-3 border-t border-gray-100 w-full justify-center">
                      {bed.status === "Cleaning" && (
                        <button
                          onClick={() => handleBedStatus(ward._id, bed._id, "Available")}
                          className="p-1.5 bg-green-100 text-green-700 hover:bg-green-200 rounded-lg cursor-pointer transition-colors"
                          title="Set Available"
                        >
                          <SparklesIcon className="w-4 h-4" />
                        </button>
                      )}
                      {bed.status === "Available" && (
                        <button
                          onClick={() => handleBedStatus(ward._id, bed._id, "Maintenance")}
                          className="p-1.5 bg-gray-100 text-gray-600 hover:bg-gray-200 rounded-lg cursor-pointer transition-colors"
                          title="Set Maintenance"
                        >
                          <WrenchIcon className="w-4 h-4" />
                        </button>
                      )}
                      {bed.status === "Maintenance" && (
                        <button
                          onClick={() => handleBedStatus(ward._id, bed._id, "Available")}
                          className="p-1.5 bg-green-100 text-green-700 hover:bg-green-200 rounded-lg cursor-pointer transition-colors"
                          title="Set Available"
                        >
                          <SparklesIcon className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Ward Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-55">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md">
            <div className="bg-slate-900 px-6 py-5 flex items-center justify-between text-white rounded-t-3xl">
              <h3 className="text-lg font-bold">Setup Ward</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-white cursor-pointer">
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-gray-500 mb-1.5">Ward Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Male General Ward A"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full border-2 border-gray-200 focus:border-[#0c213e] rounded-xl px-4 py-2.5 text-sm outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-gray-500 mb-1.5">Ward Room Type *</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full border-2 border-gray-200 focus:border-[#0c213e] rounded-xl px-4 py-2.5 text-sm outline-none bg-white"
                >
                  {wardTypes.map((t) => (
                    <option key={t} value={t}>
                      {t} Ward
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-gray-500 mb-1.5">Daily Charge (₹)</label>
                  <input
                    type="number"
                    value={chargePerDay}
                    onChange={(e) => setChargePerDay(Number(e.target.value))}
                    className="w-full border-2 border-gray-200 focus:border-[#0c213e] rounded-xl px-4 py-2.5 text-sm outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-gray-500 mb-1.5">Default Bed Count</label>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={bedCount}
                    onChange={(e) => setBedCount(Number(e.target.value))}
                    className="w-full border-2 border-gray-200 focus:border-[#0c213e] rounded-xl px-4 py-2.5 text-sm outline-none"
                  />
                </div>
              </div>

              <div className="flex gap-4 border-t border-gray-100 pt-6 mt-6">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 py-3.5 rounded-xl font-bold text-sm text-gray-700 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-[#0c213e] hover:bg-[#1a3a5f] py-3.5 text-white rounded-xl font-bold text-sm cursor-pointer"
                >
                  Setup Ward
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
