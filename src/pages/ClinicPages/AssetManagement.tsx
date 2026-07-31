import React, { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import api from "../../Services/mainApi";
import toast from "react-hot-toast";
import {
  WrenchScrewdriverIcon,
  PlusIcon,
  XMarkIcon,
  // ShieldExclamationIcon,
  WrenchIcon,
} from "@heroicons/react/24/outline";

interface RepairLog {
  _id?: string;
  date: string;
  description: string;
  cost: number;
  technician: string;
  status: string;
}

interface Asset {
  _id: string;
  assetName: string;
  purchaseDate: string;
  purchaseCost: number;
  depreciationRate: number;
  currentValuation: number;
  amcExpiryDate?: string;
  amcProvider?: string;
  repairLogs: RepairLog[];
}

interface OutletContext {
  clinicId: string;
}

export default function AssetManagement() {
  const { clinicId } = useOutletContext<OutletContext>();

  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showRepairModal, setShowRepairModal] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);

  // Form states (Add Asset)
  const [name, setName] = useState("");
  const [purchaseDate, setPurchaseDate] = useState("");
  const [purchaseCost, setPurchaseCost] = useState(0);
  const [depRate, setDepRate] = useState(10);
  const [amcExpiry, setAmcExpiry] = useState("");
  const [amcProvider, setAmcProvider] = useState("");

  // Form states (Log Repair)
  const [repDesc, setRepDesc] = useState("");
  const [repCost, setRepCost] = useState(0);
  const [repTech, setRepTech] = useState("");

  const fetchAssets = async () => {
    if (!clinicId) return;
    try {
      setLoading(true);
      const res = await api.get(`/api/asset-supplier/assets/${clinicId}`);
      if (res.data.success) {
        setAssets(res.data.assets);
      }
    } catch {
      toast.error("Failed to load clinical assets directory");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssets();
  }, [clinicId]);

  const handleAddAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !purchaseDate || purchaseCost <= 0) {
      toast.error("Please fill in required fields correctly.");
      return;
    }

    try {
      const res = await api.post("/api/asset-supplier/assets/add", {
        clinicId,
        assetName: name,
        purchaseDate,
        purchaseCost,
        depreciationRate: depRate,
        amcExpiryDate: amcExpiry || undefined,
        amcProvider: amcProvider || undefined,
      });

      if (res.data.success) {
        toast.success("Asset onboarded and acquisition cost posted as expense!");
        setShowAddModal(false);
        setName("");
        setPurchaseDate("");
        setPurchaseCost(0);
        setDepRate(10);
        setAmcExpiry("");
        setAmcProvider("");
        fetchAssets();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to onboard asset");
    }
  };

  const openLogRepair = (asset: Asset) => {
    setSelectedAsset(asset);
    setRepDesc("");
    setRepCost(0);
    setRepTech("");
    setShowRepairModal(true);
  };

  const handleLogRepair = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAsset || !repDesc || repCost <= 0 || !repTech) {
      toast.error("All repair fields are required");
      return;
    }

    try {
      const res = await api.post(`/api/asset-supplier/assets/repair/${selectedAsset._id}`, {
        description: repDesc,
        cost: repCost,
        technician: repTech,
        status: "Completed",
      });

      if (res.data.success) {
        toast.success("Repair event recorded and expense log saved!");
        setShowRepairModal(false);
        fetchAssets();
      }
    } catch {
      toast.error("Failed to log repair");
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
            <WrenchScrewdriverIcon className="w-6 h-6 text-[#0c213e]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Asset Depreciations & Maintenance</h1>
            <p className="text-gray-500 text-sm mt-0.5">Manage machinery depreciation charts, repair histories, and AMC limits</p>
          </div>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-[#0c213e] hover:bg-[#1a3a5f] text-white px-5 py-2.5 rounded-xl font-bold text-sm cursor-pointer transition-colors"
        >
          <PlusIcon className="w-5 h-5" />
          Onboard Asset
        </button>
      </div>

      {/* Assets inventory list */}
      {assets.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-20 text-center text-gray-400">
          No medical assets or machinery registered in directory. Onboard an asset to start tracking depreciation.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {assets.map((asset) => {
            const hasAmc = asset.amcExpiryDate ? new Date(asset.amcExpiryDate) > new Date() : false;
            return (
              <div key={asset._id} className="bg-white border border-gray-150 rounded-2xl p-6 shadow-2xs space-y-4">
                
                {/* Upper banner */}
                <div className="flex justify-between items-start border-b border-gray-100 pb-3">
                  <div>
                    <h3 className="font-bold text-base text-gray-900">{asset.assetName}</h3>
                    <p className="text-xs text-gray-450 mt-0.5">
                      Purchased on {new Date(asset.purchaseDate).toLocaleDateString()} for ₹{asset.purchaseCost.toLocaleString()}
                    </p>
                  </div>
                  {asset.amcExpiryDate && (
                    <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold border ${
                      hasAmc ? "bg-green-50 text-green-700 border-green-200" : "bg-red-50 text-red-650 border-red-200"
                    }`}>
                      {hasAmc ? "AMC Active" : "AMC Expired"}
                    </span>
                  )}
                </div>

                {/* Valuations info grid */}
                <div className="grid grid-cols-2 gap-3 bg-gray-50 border border-gray-100 p-4 rounded-xl text-xs">
                  <div>
                    <span className="text-gray-400 block font-bold text-[9px] uppercase tracking-wider">Depreciation Rate</span>
                    <strong className="text-gray-950 font-bold">{asset.depreciationRate}% / Year</strong>
                  </div>
                  <div>
                    <span className="text-gray-400 block font-bold text-[9px] uppercase tracking-wider">Estimated Valuation</span>
                    <strong className="text-blue-700 font-bold">₹{asset.currentValuation.toLocaleString()}</strong>
                  </div>
                  {asset.amcExpiryDate && (
                    <div className="col-span-2 border-t border-gray-200/60 pt-2 flex justify-between">
                      <span>AMC Provider: <strong>{asset.amcProvider}</strong></span>
                      <span>Expires: <strong>{new Date(asset.amcExpiryDate).toLocaleDateString()}</strong></span>
                    </div>
                  )}
                </div>

                {/* Repair Logs Section */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs border-b border-gray-100 pb-1.5 font-bold text-gray-700">
                    <span>Repair History ({asset.repairLogs.length})</span>
                    <button
                      onClick={() => openLogRepair(asset)}
                      className="text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <WrenchIcon className="w-3.5 h-3.5" /> Log Repair
                    </button>
                  </div>

                  {asset.repairLogs.length === 0 ? (
                    <p className="text-[11px] text-gray-400 italic">No maintenance repairs logged for this asset.</p>
                  ) : (
                    <div className="max-h-28 overflow-y-auto space-y-1.5 divide-y divide-gray-100 pr-1">
                      {asset.repairLogs.map((log, idx) => (
                        <div key={idx} className="pt-1.5 flex justify-between text-[11px] font-medium text-gray-650">
                          <div>
                            <p className="text-gray-800">"{log.description}"</p>
                            <span className="text-gray-400 text-[10px]">By {log.technician} on {new Date(log.date).toLocaleDateString()}</span>
                          </div>
                          <span className="font-bold text-gray-900">₹{log.cost.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* Onboard Asset Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-55">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md">
            <div className="bg-slate-900 px-6 py-5 flex items-center justify-between text-white rounded-t-3xl">
              <h3 className="text-lg font-bold">Onboard Asset / Machinery</h3>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-white cursor-pointer">
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleAddAsset} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-gray-500 mb-1.5">Asset Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Siemens MRI Scanner Model X"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full border-2 border-gray-200 focus:border-[#0c213e] rounded-xl px-4 py-2.5 text-sm outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-gray-500 mb-1.5">Purchase Date *</label>
                  <input
                    type="date"
                    required
                    value={purchaseDate}
                    onChange={(e) => setPurchaseDate(e.target.value)}
                    className="w-full border-2 border-gray-200 focus:border-[#0c213e] rounded-xl px-4 py-2 text-sm outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-gray-500 mb-1.5">Purchase Cost (₹) *</label>
                  <input
                    type="number"
                    required
                    value={purchaseCost}
                    onChange={(e) => setPurchaseCost(Number(e.target.value))}
                    className="w-full border-2 border-gray-200 focus:border-[#0c213e] rounded-xl px-4 py-2.5 text-sm outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-gray-500 mb-1.5">Depreciation Rate (% per year)</label>
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={depRate}
                  onChange={(e) => setDepRate(Number(e.target.value))}
                  className="w-full border-2 border-gray-200 focus:border-[#0c213e] rounded-xl px-4 py-2.5 text-sm outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 border-t border-gray-100 pt-3">
                <div className="col-span-2 text-xs font-bold text-gray-400 uppercase tracking-wide">AMC parameters (Optional)</div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">AMC Provider</label>
                  <input
                    type="text"
                    placeholder="Siemens India"
                    value={amcProvider}
                    onChange={(e) => setAmcProvider(e.target.value)}
                    className="w-full border-2 border-gray-200 focus:border-[#0c213e] rounded-xl px-3 py-1.5 text-sm outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">AMC Expiry Date</label>
                  <input
                    type="date"
                    value={amcExpiry}
                    onChange={(e) => setAmcExpiry(e.target.value)}
                    className="w-full border-2 border-gray-200 focus:border-[#0c213e] rounded-xl px-3 py-1 text-sm outline-none"
                  />
                </div>
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
                  Onboard
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Log Repair Modal */}
      {showRepairModal && selectedAsset && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-55">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm">
            <div className="bg-slate-900 px-6 py-5 flex items-center justify-between text-white rounded-t-3xl">
              <h3 className="text-lg font-bold">Log Repair for {selectedAsset.assetName}</h3>
              <button onClick={() => setShowRepairModal(false)} className="text-gray-400 hover:text-white cursor-pointer">
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleLogRepair} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-gray-500 mb-1.5">Repair Description *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Replaced capacitor on tube connector"
                  value={repDesc}
                  onChange={(e) => setRepDesc(e.target.value)}
                  className="w-full border-2 border-gray-200 focus:border-[#0c213e] rounded-xl px-4 py-2.5 text-sm outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-gray-500 mb-1.5">Repair Cost (₹) *</label>
                <input
                  type="number"
                  required
                  value={repCost}
                  onChange={(e) => setRepCost(Number(e.target.value))}
                  className="w-full border-2 border-gray-200 focus:border-[#0c213e] rounded-xl px-4 py-2.5 text-sm outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-gray-500 mb-1.5">Technician / Agency *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Philips Service Engineer"
                  value={repTech}
                  onChange={(e) => setRepTech(e.target.value)}
                  className="w-full border-2 border-gray-200 focus:border-[#0c213e] rounded-xl px-4 py-2.5 text-sm outline-none"
                />
              </div>

              <div className="flex gap-4 border-t border-gray-100 pt-6">
                <button
                  type="button"
                  onClick={() => setShowRepairModal(false)}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 py-3.5 rounded-xl font-bold text-sm text-gray-700 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-[#0c213e] hover:bg-[#1a3a5f] py-3.5 text-white rounded-xl font-bold text-sm cursor-pointer"
                >
                  Log Repair
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
