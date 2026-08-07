import React, { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { Pill, Plus, Trash2, Search, Check, X, AlertCircle } from "lucide-react";
import api from "../../Services/mainApi";

const PRIMARY = "#0c213e";

// ── tiny helpers ─────────────────────────────────────────────────────────────

const Toast = ({
  message,
  type,
  onDone,
}: {
  message: string;
  type: "success" | "error";
  onDone: () => void;
}) => {
  useEffect(() => {
    const t = setTimeout(onDone, 3200);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div
      className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-lg
        border text-sm font-medium am-toast-enter
        ${
          type === "success"
            ? "bg-emerald-50 border-emerald-200 text-emerald-800"
            : "bg-red-50 border-red-200 text-red-800"
        }`}
    >
      {type === "success" ? (
        <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
      ) : (
        <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
      )}
      {message}
      <button onClick={onDone} className="ml-2 opacity-50 hover:opacity-100 transition-opacity">
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};

// ── main ─────────────────────────────────────────────────────────────────────

const AddMedicine: React.FC = () => {
  const doctorId = localStorage.getItem("doctorId");

  const [medicines, setMedicines] = useState<string[]>([""]);
  const [savedMedicines, setSavedMedicines] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingSet, setDeletingSet] = useState<Set<string>>(new Set());
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Medicine Kits states
  const [kits, setKits] = useState<{ _id: string; name: string; medicines: string[] }[]>([]);
  // const [loadingKits, setLoadingKits] = useState(false);
  const [kitName, setKitName] = useState("");
  const [selectedKitMeds, setSelectedKitMeds] = useState<string[]>([]);

  const lastInputRef = useRef<HTMLInputElement>(null);

  // Master suggestions states
  const [activeInputIndex, setActiveInputIndex] = useState<number | null>(null);
  const [inputSuggestions, setInputSuggestions] = useState<string[]>([]);
  const inputSearchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Master Database Explorer states
  const [masterQuery, setMasterQuery] = useState("");
  const [masterResults, setMasterResults] = useState<{ _id: string; name: string }[]>([]);
  const [searchingMaster, setSearchingMaster] = useState(false);

  // ── fetch ────────────────────────────────────────────────────────────────

  const fetchMedicineList = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(`/api/doctor/medicine-list/${doctorId}`);
      if (res.data.success) setSavedMedicines(res.data.listOfMedicine || []);
    } catch {
      setToast({ msg: "Failed to load medicine list", type: "error" });
    } finally {
      setLoading(false);
    }
  }, [doctorId]);

  const fetchKits = useCallback(async () => {
    if (!doctorId) return;
    // setLoadingKits(true);
    try {
      const res = await api.get(`/api/doctor/kits/${doctorId}`);
      if (res.data.success) {
        setKits(res.data.kits || []);
      }
    } catch (err) {
      console.error("Failed to load kits:", err);
    } finally {
      // setLoadingKits(false);
    }
  }, [doctorId]);

  useEffect(() => {
    fetchMedicineList();
    fetchKits();
  }, [fetchMedicineList, fetchKits]);

  // ── input management ─────────────────────────────────────────────────────

  const handleChange = (index: number, value: string) => {
    const updated = [...medicines];
    updated[index] = value;
    setMedicines(updated);

    setActiveInputIndex(index);

    if (!value.trim()) {
      setInputSuggestions([]);
      return;
    }

    if (inputSearchTimeoutRef.current) {
      clearTimeout(inputSearchTimeoutRef.current);
    }

    inputSearchTimeoutRef.current = setTimeout(async () => {
      try {
        const res = await api.get<any>(`/api/doctor/search-master-medicines`, {
          params: { q: value }
        });
        if (res.data.success && Array.isArray(res.data.medicines)) {
          setInputSuggestions(res.data.medicines.map((m: any) => m.name));
        }
      } catch (err) {
        console.error(err);
      }
    }, 200);
  };

  const addField = () => {
    setMedicines((prev) => [...prev, ""]);
    // focus new field after render
    setTimeout(() => lastInputRef.current?.focus(), 50);
  };

  const removeField = (index: number) => {
    if (medicines.length > 1) {
      setMedicines(medicines.filter((_, i) => i !== index));
    }
  };

  // Enter key on last field → add new field
  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === "Enter" && index === medicines.length - 1) {
      e.preventDefault();
      if (medicines[index].trim()) addField();
    }
  };

  // ── save ─────────────────────────────────────────────────────────────────

  const handleSave = async () => {
    const valid = medicines.filter((m) => m.trim() !== "");
    if (!valid.length) return;

    setSaving(true);
    try {
      const res = await api.post("/api/doctor/add/medicine-to-list", {
        doctorId,
        medicines: valid,
      });
      if (res.data.success) {
        setToast({ msg: `${valid.length} medicine${valid.length > 1 ? "s" : ""} added successfully`, type: "success" });
        setMedicines([""]);
        fetchMedicineList();
      }
    } catch {
      setToast({ msg: "Failed to save medicines. Please try again.", type: "error" });
    } finally {
      setSaving(false);
    }
  };

  // ── delete ───────────────────────────────────────────────────────────────

  const handleDelete = async (name: string) => {
    // Optimistic
    setSavedMedicines((prev) => prev.filter((m) => m !== name));
    setDeletingSet((s) => new Set(s).add(name));

    try {
      const res = await api.delete("/api/doctor/delete/medicine-from-list", {
        data: { doctorId, medicineName: name },
      });
      if (!res.data.success) throw new Error();
    } catch {
      // Revert
      setSavedMedicines((prev) => [...prev, name].sort());
      setToast({ msg: `Failed to delete "${name}"`, type: "error" });
    } finally {
      setDeletingSet((s) => {
        const next = new Set(s);
        next.delete(name);
        return next;
      });
    }
  };

  // ── CSV Bulk Upload ──────────────────────────────────────────────────────
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result;
      if (typeof text !== "string") return;
      
      const rows = text.split("\n").map(r => r.trim()).filter(r => r.length > 0);
      const newMeds = rows.map(r => {
        const firstCell = r.split(",")[0];
        return firstCell.replace(/"/g, "").trim();
      }).filter(r => r.toLowerCase() !== "name" && r.toLowerCase() !== "medicine" && r !== "");
      
      if (newMeds.length > 0) {
        setMedicines(newMeds);
        setToast({ msg: `Parsed ${newMeds.length} medicines. Click "Save to List" to save them!`, type: "success" });
      } else {
        setToast({ msg: "No valid medicine entries found in file", type: "error" });
      }
    };
    reader.readAsText(file);
  };

  // ── Kit creation ─────────────────────────────────────────────────────────
  const toggleKitMedicine = (med: string) => {
    setSelectedKitMeds(prev => 
      prev.includes(med) ? prev.filter(m => m !== med) : [...prev, med]
    );
  };

  const handleCreateKit = async () => {
    if (!kitName.trim()) {
      setToast({ msg: "Please specify a name for the kit", type: "error" });
      return;
    }
    if (selectedKitMeds.length === 0) {
      setToast({ msg: "Please select at least one medicine to bundle", type: "error" });
      return;
    }
    try {
      const res = await api.post("/api/doctor/kits/create", {
        doctorId,
        name: kitName.trim(),
        medicines: selectedKitMeds
      });
      if (res.data.success) {
        setToast({ msg: `Kit "${kitName}" created successfully!`, type: "success" });
        setKitName("");
        setSelectedKitMeds([]);
        fetchKits();
      }
    } catch (err) {
      setToast({ msg: "Failed to create medicine kit", type: "error" });
    }
  };

  // ── Master DB Explorer ───────────────────────────────────────────────────
  const searchMaster = async (val: string) => {
    setMasterQuery(val);
    if (!val.trim()) {
      setMasterResults([]);
      return;
    }
    setSearchingMaster(true);
    try {
      const res = await api.get<any>(`/api/doctor/search-master-medicines`, {
        params: { q: val }
      });
      if (res.data.success) {
        setMasterResults(res.data.medicines || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSearchingMaster(false);
    }
  };

  const handleAddFromMaster = async (medName: string) => {
    try {
      const res = await api.post<any>("/api/doctor/add/medicine-to-list", {
        doctorId,
        medicines: [medName],
      });
      if (res.data.success) {
        setToast({ msg: `"${medName}" added to your formulary!`, type: "success" });
        fetchMedicineList();
      }
    } catch {
      setToast({ msg: "Failed to add master medicine", type: "error" });
    }
  };

  // ── derived ──────────────────────────────────────────────────────────────

  const filtered = savedMedicines.filter((m) =>
    m.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginatedMedicines = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filtered.slice(start, start + itemsPerPage);
  }, [filtered, currentPage]);

  const hasValidInput = medicines.some((m) => m.trim() !== "");

  // ── render ───────────────────────────────────────────────────────────────

  return (
    <>
      <style>{`
        .am-toast-enter { animation: amToast 0.3s cubic-bezier(0.34,1.56,0.64,1) both; }
        @keyframes amToast {
          from { opacity:0; transform: translateY(12px) scale(0.96); }
          to   { opacity:1; transform: translateY(0) scale(1); }
        }
        .am-fade-in { animation: amFade 0.2s ease both; }
        @keyframes amFade {
          from { opacity:0; transform:translateY(6px); }
          to   { opacity:1; transform:translateY(0); }
        }
        .am-pill:hover .am-del { opacity:1; }
        .am-del { opacity:0; transition: opacity 0.15s; }
        .am-input:focus { border-color: #0c213e; box-shadow: 0 0 0 3px rgba(12,33,62,0.1); }
      `}</style>

      <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
        <div className="w-full">

          {/* ── PAGE HEADER ──────────────────────────────────────────────── */}
          <div className="mb-8">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-1">
              Doctor Dashboard
            </p>
            <h1 className="text-3xl font-bold tracking-tight" style={{ color: PRIMARY }}>
              Medicine List
            </h1>
            <p className="mt-1 text-slate-500 text-sm">
              Build and manage your personal formulary for quick prescription lookup
            </p>
          </div>

          {/* ── ADD SECTION ──────────────────────────────────────────────── */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-6">
            {/* accent bar */}
            <div className="h-1 w-full" style={{ background: `linear-gradient(90deg, ${PRIMARY}, #1e3a5f, #2d5282)` }} />

            <div className="p-6 sm:p-8">
              <div className="flex items-center gap-3 mb-6">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: PRIMARY }}
                >
                  <Pill className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-slate-900">Add New Medicines</h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Type a name and press Enter to add another row
                  </p>
                </div>
              </div>

              {/* Input rows */}
              <div className="space-y-2.5 mb-6">
                {medicines.map((med, index) => {
                  const isLast = index === medicines.length - 1;
                  return (
                    <div key={index} className="am-fade-in flex items-center gap-2 group">
                      {/* row number */}
                      <span className="w-6 text-center text-xs font-medium text-slate-400 flex-shrink-0 tabular-nums">
                        {index + 1}
                      </span>

                      <div className="relative flex-1">
                        <input
                          ref={isLast ? lastInputRef : undefined}
                          type="text"
                          value={med}
                          onChange={(e) => handleChange(index, e.target.value)}
                          onKeyDown={(e) => handleKeyDown(e, index)}
                          onFocus={() => setActiveInputIndex(index)}
                          onBlur={() => setTimeout(() => {
                            setActiveInputIndex(prev => prev === index ? null : prev);
                          }, 250)}
                          placeholder="e.g. Paracetamol 500mg"
                          className="am-input w-full rounded-xl border border-slate-200 bg-slate-50
                            px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400
                            outline-none transition-all duration-150 focus:bg-white"
                        />
                        {activeInputIndex === index && inputSuggestions.length > 0 && (
                          <ul className="absolute left-0 top-full mt-1.5 w-full bg-white border border-slate-200 rounded-xl shadow-lg z-50 max-h-48 overflow-y-auto py-1.5 divide-y divide-slate-100">
                            {inputSuggestions.map((sug) => (
                              <li
                                key={sug}
                                onMouseDown={() => {
                                  const updated = [...medicines];
                                  updated[index] = sug;
                                  setMedicines(updated);
                                  setInputSuggestions([]);
                                }}
                                className="px-4 py-2 hover:bg-slate-50 text-xs font-semibold text-slate-700 cursor-pointer transition-colors"
                              >
                                {sug}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>

                      {/* action button */}
                      {isLast ? (
                        <button
                          onClick={addField}
                          disabled={!med.trim()}
                          className="w-10 h-10 rounded-xl flex items-center justify-center
                            transition-all hover:scale-105 active:scale-95
                            disabled:opacity-30 disabled:cursor-not-allowed flex-shrink-0"
                          style={{ backgroundColor: PRIMARY }}
                          title="Add another (or press Enter)"
                        >
                          <Plus className="w-4 h-4 text-white" />
                        </button>
                      ) : (
                        <button
                          onClick={() => removeField(index)}
                          className="w-10 h-10 rounded-xl bg-red-50 hover:bg-red-100 flex items-center justify-center
                            transition-all hover:scale-105 active:scale-95 flex-shrink-0
                            opacity-0 group-hover:opacity-100"
                          title="Remove row"
                        >
                          <X className="w-4 h-4 text-red-500" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Save button */}
              <div className="flex items-center gap-4">
                <button
                  onClick={handleSave}
                  disabled={saving || !hasValidInput}
                  className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-semibold
                    text-white rounded-xl shadow-sm transition-all duration-150
                    hover:opacity-90 hover:shadow-md active:scale-[0.98]
                    disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{ backgroundColor: PRIMARY }}
                >
                  {saving ? (
                    <>
                      <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                      </svg>
                      Saving…
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      Save to List
                    </>
                  )}
                </button>

                {medicines.filter((m) => m.trim()).length > 0 && (
                  <span className="text-xs text-slate-400">
                    {medicines.filter((m) => m.trim()).length} medicine
                    {medicines.filter((m) => m.trim()).length !== 1 ? "s" : ""} ready to save
                  </span>
                )}
              </div>

              {/* Bulk Upload Excel/CSV container */}
              <div className="mt-6 p-4 bg-slate-50 rounded-xl border border-slate-200 border-dashed flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <h4 className="text-xs font-bold text-slate-700">Bulk Upload Medicines</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">Upload a CSV or plain text file containing medicine names (one per line).</p>
                </div>
                <div>
                  <label className="inline-flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 text-xs font-bold rounded-xl shadow-xs cursor-pointer transition">
                    <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                    Choose CSV / TXT File
                    <input
                      type="file"
                      accept=".csv,.txt"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

            </div>
          </div>

          {/* ── SAVED LIST SECTION ───────────────────────────────────────── */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="h-1 w-full bg-gradient-to-r from-slate-200 via-slate-300 to-slate-200" />

            <div className="p-6 sm:p-8">
              {/* Section header */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
                <div className="flex items-center gap-3 flex-1">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-slate-100">
                    <Pill className="w-5 h-5 text-slate-600" />
                  </div>
                  <div className="flex items-center gap-2.5">
                    <h2 className="text-base font-semibold text-slate-900">My Formulary</h2>
                    <span
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold text-white"
                      style={{ backgroundColor: PRIMARY }}
                    >
                      {savedMedicines.length}
                    </span>
                  </div>
                </div>

                {/* Search */}
                {savedMedicines.length > 0 && (
                  <div className="relative w-full sm:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search medicines…"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="am-input w-full pl-9 pr-9 py-2 text-sm rounded-xl border border-slate-200
                        bg-slate-50 outline-none transition-all focus:bg-white placeholder:text-slate-400"
                    />
                    {searchTerm && (
                      <button
                        onClick={() => setSearchTerm("")}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* States */}
              {loading ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3">
                  <div
                    className="w-10 h-10 border-[3px] border-t-transparent rounded-full animate-spin"
                    style={{ borderColor: `${PRIMARY}40`, borderTopColor: "transparent" }}
                  />
                  <p className="text-sm text-slate-400">Loading your formulary…</p>
                </div>
              ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
                    <Pill className="w-8 h-8 text-slate-300" />
                  </div>
                  <h3 className="text-sm font-semibold text-slate-700 mb-1">
                    {searchTerm ? "No results found" : "Your formulary is empty"}
                  </h3>
                  <p className="text-xs text-slate-400 max-w-xs">
                    {searchTerm
                      ? `No medicines matching "${searchTerm}". Try a different term.`
                      : "Add your commonly prescribed medicines above to get started."}
                  </p>
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm("")}
                      className="mt-4 text-xs font-medium underline underline-offset-2 text-slate-500 hover:text-slate-800 transition-colors"
                    >
                      Clear search
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                  
                  {/* Left Column: My Formulary (8 cols) */}
                  <div className="lg:col-span-8 space-y-6">
                    {/* Kit Builder Card Banner */}
                    {selectedKitMeds.length > 0 && (
                      <div className="p-4 bg-amber-50 border border-amber-250 rounded-2xl shadow-xs am-fade-in flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                        <div>
                          <h4 className="text-sm font-bold text-amber-900">Create Preset Medicine Kit</h4>
                          <p className="text-xs text-amber-700 mt-0.5">You have selected <span className="font-extrabold">{selectedKitMeds.length}</span> medicines to bundle.</p>
                        </div>
                        <div className="flex w-full md:w-auto items-center gap-2">
                          <input
                            type="text"
                            placeholder="e.g. Viral Fever Kit"
                            value={kitName}
                            onChange={(e) => setKitName(e.target.value)}
                            className="bg-white border border-amber-300 rounded-xl px-3.5 py-1.5 text-xs text-slate-800 focus:outline-none w-full md:w-56"
                          />
                          <button
                            onClick={handleCreateKit}
                            className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-sm transition whitespace-nowrap cursor-pointer"
                          >
                            Create Kit
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Alpha grouping header hint */}
                    {searchTerm && (
                      <p className="text-xs text-slate-400">
                        {filtered.length} result{filtered.length !== 1 ? "s" : ""} for &ldquo;{searchTerm}&rdquo;
                      </p>
                    )}

                    {/* Preset Kits Log */}
                    {kits.length > 0 && (
                      <div className="p-4 bg-slate-50 border border-slate-250/60 rounded-2xl">
                        <h4 className="text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-2.5">My Saved Preset Kits ({kits.length})</h4>
                        <div className="flex flex-wrap gap-2">
                          {kits.map((k) => (
                            <div key={k._id} className="inline-flex items-center gap-2 px-3 py-1 bg-amber-50 text-amber-800 border border-amber-200 text-xs font-bold rounded-xl">
                              <span>💊 {k.name}</span>
                              <span className="text-[10px] text-amber-700 bg-amber-100/50 px-1.5 py-0.5 rounded font-extrabold">
                                {k.medicines.length} drugs
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* High Density Registry Data Table */}
                    <div className="border border-slate-200/80 rounded-2xl overflow-hidden bg-slate-50/50">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                          <thead className="bg-[#0c213e] text-white text-xs font-bold uppercase tracking-wider">
                            <tr>
                              <th className="px-5 py-3.5 text-center w-14">
                                <span className="text-[10px] text-slate-400 block font-normal">Kit Select</span>
                              </th>
                              <th className="px-6 py-3.5 w-16">No.</th>
                              <th className="px-6 py-3.5">Medicine Name</th>
                              <th className="px-6 py-3.5">Type</th>
                              <th className="px-6 py-3.5 text-center w-24">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-150 text-sm text-slate-700 bg-white">
                            {paginatedMedicines.map((medicine: string, index: number) => {
                              const isDeleting = deletingSet.has(medicine);
                              const realIndex = (currentPage - 1) * itemsPerPage + index + 1;
                              
                              // Inferred medicine type logic
                              let medType = "Tablet";
                              const medLower = medicine.toLowerCase();
                              if (medLower.includes("syrup") || medLower.includes("suspension") || medLower.includes("syr")) {
                                medType = "Syrup";
                              } else if (medLower.includes("injection") || medLower.includes("inj") || medLower.includes("iv")) {
                                medType = "Injection";
                              } else if (medLower.includes("cream") || medLower.includes("ointment") || medLower.includes("gel")) {
                                medType = "Cream";
                              } else if (medLower.includes("drops") || medLower.includes("drop")) {
                                medType = "Drops";
                              } else if (medLower.includes("inhaler") || medLower.includes("rotacap")) {
                                medType = "Inhaler";
                              }

                              return (
                                <tr key={medicine} className="hover:bg-slate-50/50 transition duration-150">
                                  {/* Kit selector checkbox */}
                                  <td className="px-5 py-3.5 text-center">
                                    <input
                                      type="checkbox"
                                      checked={selectedKitMeds.includes(medicine)}
                                      onChange={() => toggleKitMedicine(medicine)}
                                      className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                                    />
                                  </td>
                                  
                                  <td className="px-6 py-3.5 font-bold text-slate-400 tabular-nums">
                                    {realIndex}
                                  </td>

                                  <td className="px-6 py-3.5 font-semibold text-slate-800">
                                    {medicine}
                                  </td>

                                  <td className="px-6 py-3.5">
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide border ${
                                      medType === "Tablet" ? "bg-blue-50 text-blue-700 border-blue-200" :
                                      medType === "Syrup" ? "bg-amber-50 text-amber-700 border-amber-200" :
                                      medType === "Injection" ? "bg-purple-50 text-purple-700 border-purple-200" :
                                      medType === "Cream" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                                      "bg-slate-50 text-slate-700 border-slate-200"
                                    }`}>
                                      {medType}
                                    </span>
                                  </td>

                                  <td className="px-6 py-3.5 text-center">
                                    <button
                                      disabled={isDeleting}
                                      onClick={() => handleDelete(medicine)}
                                      className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 transition-all flex items-center justify-center mx-auto"
                                      title={`Remove ${medicine}`}
                                    >
                                      {isDeleting ? (
                                        <svg className="animate-spin w-3.5 h-3.5 text-red-500" fill="none" viewBox="0 0 24 24">
                                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                                        </svg>
                                      ) : (
                                        <Trash2 className="w-3.5 h-3.5 text-red-500" />
                                      )}
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>

                      {/* Pagination Bar */}
                      {totalPages > 1 && (
                        <div className="flex flex-col sm:flex-row justify-between items-center px-6 py-4 border-t border-slate-200 bg-white gap-3">
                          <span className="text-xs text-slate-400">
                            Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filtered.length)} of {filtered.length} medicines
                          </span>
                          <div className="flex gap-2.5">
                            <button
                              type="button"
                              disabled={currentPage === 1}
                              onClick={() => setCurrentPage(prev => prev - 1)}
                              className="px-3.5 py-1.5 bg-white hover:bg-slate-50 text-xs font-bold rounded-xl border border-slate-300 shadow-3xs transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                            >
                              Prev
                            </button>
                            <span className="text-xs font-bold text-slate-500 self-center">
                              Page {currentPage} of {totalPages}
                            </span>
                            <button
                              type="button"
                              disabled={currentPage === totalPages}
                              onClick={() => setCurrentPage(prev => prev + 1)}
                              className="px-3.5 py-1.5 bg-white hover:bg-slate-50 text-xs font-bold rounded-xl border border-slate-300 shadow-3xs transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                            >
                              Next
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Column: Master DB Search Explorer (4 cols) */}
                  <div className="lg:col-span-4 bg-slate-50 border border-slate-200/80 rounded-2xl overflow-hidden self-start">
                    <div className="h-1 w-full bg-gradient-to-r from-amber-200 via-amber-400 to-amber-200" />
                    <div className="p-5">
                      <div className="flex items-center gap-2 mb-2.5">
                        <h3 className="text-sm font-bold text-slate-800">Master Rx Lookup</h3>
                        <span className="px-2 py-0.5 bg-slate-200 text-[10px] text-slate-600 font-extrabold rounded-full">1,500+ Seeded</span>
                      </div>
                      <p className="text-[11px] text-slate-400 mb-4">Query the global formulations catalog and import drugs to your preferred list in one click.</p>
                      
                      <div className="relative mb-4">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                          type="text"
                          placeholder="Search master catalog..."
                          value={masterQuery}
                          onChange={(e) => searchMaster(e.target.value)}
                          className="am-input w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 bg-white outline-none transition focus:ring-2 focus:ring-amber-400/20 focus:border-amber-400"
                        />
                      </div>

                      {searchingMaster ? (
                        <div className="flex items-center justify-center py-8 gap-2">
                          <div className="w-4.5 h-4.5 border-2 border-t-transparent border-slate-500 rounded-full animate-spin" />
                          <span className="text-xs text-slate-400 font-medium">Querying database...</span>
                        </div>
                      ) : masterResults.length === 0 ? (
                        <div className="py-10 text-center bg-white rounded-xl border border-slate-150 border-dashed">
                          <span className="text-xs text-slate-400 font-medium px-4 block">
                            {masterQuery ? "No medicines matching query found." : "Type above to search the 1,500 medicine catalog."}
                          </span>
                        </div>
                      ) : (
                        <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                          {masterResults.map((med) => {
                            const alreadyAdded = savedMedicines.includes(med.name);
                            return (
                              <div key={med._id} className="flex items-center justify-between p-2.5 bg-white border border-slate-150 rounded-xl gap-2 hover:border-slate-350 transition duration-150">
                                <span className="text-xs font-semibold text-slate-700 truncate flex-1">{med.name}</span>
                                {alreadyAdded ? (
                                  <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-100 whitespace-nowrap">Added</span>
                                ) : (
                                  <button
                                    onClick={() => handleAddFromMaster(med.name)}
                                    className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-350 text-slate-700 text-[10px] font-bold rounded-lg shadow-3xs cursor-pointer transition whitespace-nowrap"
                                  >
                                    + Add
                                  </button>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>

                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── TOAST ──────────────────────────────────────────────────────────── */}
      {toast && (
        <Toast
          message={toast.msg}
          type={toast.type}
          onDone={() => setToast(null)}
        />
      )}
    </>
  );
};

export default AddMedicine;