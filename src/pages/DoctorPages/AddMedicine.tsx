import React, { useEffect, useState, useRef, useCallback } from "react";
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

  const lastInputRef = useRef<HTMLInputElement>(null);

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

  useEffect(() => {
    fetchMedicineList();
  }, [fetchMedicineList]);

  // ── input management ─────────────────────────────────────────────────────

  const handleChange = (index: number, value: string) => {
    const updated = [...medicines];
    updated[index] = value;
    setMedicines(updated);
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

  // ── derived ──────────────────────────────────────────────────────────────

  const filtered = savedMedicines.filter((m) =>
    m.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

                      <input
                        ref={isLast ? lastInputRef : undefined}
                        type="text"
                        value={med}
                        onChange={(e) => handleChange(index, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(e, index)}
                        placeholder="e.g. Paracetamol 500mg"
                        className="am-input flex-1 rounded-xl border border-slate-200 bg-slate-50
                          px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400
                          outline-none transition-all duration-150 focus:bg-white"
                      />

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
                <>
                  {/* Alpha grouping header hint */}
                  {searchTerm && (
                    <p className="text-xs text-slate-400 mb-3">
                      {filtered.length} result{filtered.length !== 1 ? "s" : ""} for &ldquo;{searchTerm}&rdquo;
                    </p>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                    {filtered.map((medicine, index) => {
                      const isDeleting = deletingSet.has(medicine);
                      return (
                        <div
                          key={index}
                          className={`am-pill group relative flex items-center gap-3 p-3.5
                            rounded-xl border transition-all duration-150 cursor-default
                            ${
                              isDeleting
                                ? "opacity-40 border-slate-200 bg-slate-50"
                                : "border-slate-200 bg-slate-50 hover:bg-white hover:border-slate-300 hover:shadow-sm"
                            }`}
                        >
                          {/* icon */}
                          <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                            style={{ backgroundColor: `${PRIMARY}15` }}
                          >
                            <Pill className="w-4 h-4" style={{ color: PRIMARY }} />
                          </div>

                          {/* name */}
                          <span className="text-sm font-medium text-slate-800 truncate flex-1">
                            {medicine}
                          </span>

                          {/* delete button */}
                          <button
                            disabled={isDeleting}
                            onClick={() => handleDelete(medicine)}
                            className="am-del ml-auto p-1.5 rounded-lg bg-red-50 hover:bg-red-100
                              transition-all hover:scale-110 active:scale-95 flex-shrink-0
                              disabled:cursor-not-allowed"
                            title={`Remove ${medicine}`}
                          >
                            {isDeleting ? (
                              <svg className="animate-spin w-3.5 h-3.5 text-red-400" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                              </svg>
                            ) : (
                              <Trash2 className="w-3.5 h-3.5 text-red-500" />
                            )}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </>
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