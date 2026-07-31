import React, { useEffect, useState, useMemo, useRef } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { X, Plus } from "lucide-react";
import api from "../../Services/mainApi";
import Swal from "sweetalert2";

import diseaseData from "../../assets/Disease_symptom_dataset.json";
import symptomData from "../../assets/symptoms.json";

interface Medicine {
  name: string;
  dosage: string;
  quantity?: string;
}

// ─── Chip ─────────────────────────────────────────────────────────────────────
const Chip: React.FC<{ label: string; onRemove: () => void; color?: "blue" | "green" | "violet" }> = ({
  label, onRemove, color = "blue",
}) => {
  const styles = {
    blue: "bg-blue-50 text-blue-800 border-blue-200",
    green: "bg-emerald-50 text-emerald-800 border-emerald-200",
    violet: "bg-violet-50 text-violet-800 border-violet-200",
  };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border ${styles[color]}`}>
      {label}
      <button type="button" onClick={onRemove} className="opacity-40 hover:opacity-80 transition-opacity">
        <X size={11} strokeWidth={2.5} />
      </button>
    </span>
  );
};

// ─── Autocomplete ─────────────────────────────────────────────────────────────
const AutocompleteInput: React.FC<{
  value: string;
  onChange: (v: string) => void;
  suggestions: string[];
  onSelect: (v: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
}> = ({ value, onChange, suggestions, onSelect, placeholder, disabled, className = "", onKeyDown }) => {
  const [open, setOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setOpen(suggestions.length > 0 && value.trim().length > 0);
    setActiveIdx(-1);
  }, [suggestions, value]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (open) {
      if (e.key === "ArrowDown") { e.preventDefault(); setActiveIdx((i) => Math.min(i + 1, suggestions.length - 1)); return; }
      if (e.key === "ArrowUp") { e.preventDefault(); setActiveIdx((i) => Math.max(i - 1, -1)); return; }
      if (e.key === "Enter" && activeIdx >= 0) { e.preventDefault(); onSelect(suggestions[activeIdx]); setOpen(false); return; }
      if (e.key === "Escape") { setOpen(false); return; }
    }
    onKeyDown?.(e);
  };

  return (
    <div ref={wrapRef} className={`relative ${className}`}>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => suggestions.length > 0 && value.trim() && setOpen(true)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition disabled:bg-gray-100 disabled:cursor-not-allowed"
      />
      {open && (
        <ul className="absolute left-0 top-full mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto z-50 py-1">
          {suggestions.map((s, i) => (
            <li
              key={i}
              onMouseDown={() => { onSelect(s); setOpen(false); }}
              className={`px-3 py-2 text-sm cursor-pointer transition-colors ${i === activeIdx ? "bg-blue-50 text-blue-700" : "text-gray-700 hover:bg-gray-50"}`}
            >
              {s}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

// ─── Divider ──────────────────────────────────────────────────────────────────
const Divider: React.FC<{ label: string }> = ({ label }) => (
  <div className="flex items-center gap-3 py-1">
    <div className="flex-1 h-px bg-gray-200" />
    <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest">{label}</span>
    <div className="flex-1 h-px bg-gray-200" />
  </div>
);

// ─── Field Label ─────────────────────────────────────────────────────────────
const Label: React.FC<{ children: React.ReactNode; optional?: boolean }> = ({ children, optional }) => (
  <label className="block text-sm font-medium text-gray-700 mb-1.5">
    {children}
    {optional && <span className="ml-1.5 text-xs font-normal text-gray-400">(optional)</span>}
  </label>
);

// ─── Main Component ───────────────────────────────────────────────────────────
const PrescriptionForm: React.FC = () => {
  const { bookingId, patientAadhar } = useParams();
  const doctorId = localStorage.getItem("doctorId") || undefined;
  const location = useLocation();
  const navigate = useNavigate();

  const [patientName, setPatientName] = useState<string | undefined>(() => (location.state as any)?.name);
  const [patientPhone, setPatientPhone] = useState<string | undefined>(() => (location.state as any)?.mobileNumber);
  const [patientGender, setPatientGender] = useState<string | undefined>(() => (location.state as any)?.gender);

  const [diagnosisInput, setDiagnosisInput] = useState("");
  const [allDiseases, setAllDiseases] = useState<string[]>([]);
  const [filteredDiseases, setFilteredDiseases] = useState<string[]>([]);

  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [symptomInput, setSymptomInput] = useState("");
  const [allSymptoms, setAllSymptoms] = useState<string[]>([]);
  const [filteredSymptoms, setFilteredSymptoms] = useState<string[]>([]);

  const [tests, setTests] = useState<string[]>([]);
  const [testInput, setTestInput] = useState("");

  const [medicineName, setMedicineName] = useState("");
  const [medicineDosage, setMedicineDosage] = useState("");
  const [medicineQty, setMedicineQty] = useState("");
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [allMedicines, setAllMedicines] = useState<string[]>([]);
  const [filteredMedicines, setFilteredMedicines] = useState<string[]>([]);
  const [loadingMedicines, setLoadingMedicines] = useState(false);

  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  const dosageRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    console.log("PrescriptionForm params:", { bookingId, patientAadhar });
    console.log("location.state:", location.state);
  }, [bookingId, patientAadhar, location.state]);

  useEffect(() => {
    const fetchMedicines = async () => {
      if (!doctorId) return;
      setLoadingMedicines(true);
      try {
        const res = await api.get(`/api/doctor/medicine-list/${doctorId}`);
        if (res.data.success && Array.isArray(res.data.listOfMedicine)) {
          setAllMedicines(res.data.listOfMedicine);
        }
      } catch {
        setAllMedicines(["Paracetamol", "Ibuprofen", "Amoxicillin", "Cetirizine", "Azithromycin", "Dolo 650"]);
      } finally {
        setLoadingMedicines(false);
      }
    };
    fetchMedicines();
  }, [doctorId]);

  useEffect(() => {
    try {
      if (!Array.isArray(diseaseData)) return;
      const set = new Set<string>();
      diseaseData.forEach((item: any) => item?.Disease && set.add(String(item.Disease)));
      setAllDiseases(Array.from(set));
    } catch { setAllDiseases([]); }
  }, []);

  useEffect(() => {
    try {
      if (!Array.isArray(symptomData) || !symptomData.length) return;
      const first = symptomData[0];
      if (typeof first !== "object" || !first) return;
      setAllSymptoms(Object.keys(first).filter((k) => k !== "prognosis"));
    } catch { setAllSymptoms([]); }
  }, []);

  useEffect(() => {
    const s = (location.state as any) || {};
    if (s.name) setPatientName(s.name);
    if (s.gender) setPatientGender(s.gender);
    if (s.mobileNumber) setPatientPhone(s.mobileNumber);
  }, [location.state]);

  const fmt = (s: string) => s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  const handleDiagnosisSearch = (q: string) => {
    setDiagnosisInput(q);
    if (!q.trim()) { setFilteredDiseases([]); return; }
    setFilteredDiseases(allDiseases.filter((d) => d.toLowerCase().startsWith(q.toLowerCase())).slice(0, 10));
  };

  const handleSymptomSearch = (q: string) => {
    setSymptomInput(q);
    if (!q.trim()) { setFilteredSymptoms([]); return; }
    setFilteredSymptoms(allSymptoms.filter((s) => s.toLowerCase().startsWith(q.toLowerCase())).slice(0, 10));
  };

  const addSymptom = (raw: string) => {
    const val = fmt(raw.trim());
    if (!val || symptoms.includes(val)) return;
    setSymptoms((p) => [...p, val]);
    setSymptomInput("");
    setFilteredSymptoms([]);
  };

  const handleMedicineSearch = (q: string) => {
    setMedicineName(q);
    if (!q.trim()) { setFilteredMedicines([]); return; }
    setFilteredMedicines(allMedicines.filter((m) => m.toLowerCase().includes(q.toLowerCase())).slice(0, 10));
  };

  const selectMedicine = (name: string) => {
    setMedicineName(name);
    setFilteredMedicines([]);
    setTimeout(() => dosageRef.current?.focus(), 50);
  };

  const addMedicineChip = () => {
    const name = medicineName.trim();
    const dosage = medicineDosage.trim();
    if (!name || !dosage) return;
    setMedicines((p) => [...p, { name, dosage, quantity: medicineQty.trim() }]);
    setMedicineName(""); setMedicineDosage(""); setMedicineQty("");
  };

  const addTest = () => {
    const val = testInput.trim();
    if (!val) return;
    setTests((p) => [...p, val]);
    setTestInput("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingId) {
      Swal.fire({ title: "Missing bookingId", icon: "error" });
      return;
    }
    setLoading(true);
    const payload = {
      doctorId, patientAadhar, diagnosis: diagnosisInput,
      symptoms, medicines, recommendedTests: tests, notes,
      name: patientName, gender: patientGender, mobileNumber:patientPhone
    };
    try {
      await api.post(`/api/prescription/addPrescription/${bookingId}`, payload);
      const doneIds = JSON.parse(localStorage.getItem("doctorPrescribedBookingIds") || "[]") as string[];
      if (!doneIds.includes(bookingId)) {
        localStorage.setItem("doctorPrescribedBookingIds", JSON.stringify([...doneIds, bookingId]));
      }
      Swal.fire({ title: "Prescription Saved!", icon: "success" });
      setDiagnosisInput(""); setSymptoms([]); setTests([]); setMedicines([]); setNotes("");
      if (doctorId) {
        navigate(`/doctordashboard/${doctorId}/appointments`, {
          replace: true,
          state: { prescribedBookingId: bookingId },
        });
      }
    } catch (err: any) {
      console.error("Prescription saving failed:", err);
      Swal.fire({
        title: "Error Saving Prescription",
        text: err.response?.data?.message || err.message || "Something went wrong",
        icon: "error"
      });
    } finally {
      setLoading(false);
    }
  };

  const formattedSymptomSuggestions = useMemo(() => filteredSymptoms.map(fmt), [filteredSymptoms]);

  return (
    <div className="w-full px-4 py-8">
      <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden">

        {/* Form Header */}
        <div className="bg-[#0c213e] px-8 py-6">
          <h2 className="text-xl font-bold text-white">Create Prescription</h2>
          <div className="flex items-center gap-4 mt-1">
            {patientName ? (
              <p className="text-blue-200 text-sm">
                Patient: <span className="text-white font-medium">{patientName} <br />📞{patientPhone}</span> <br />
                {patientGender && (
                  <span className="ml-2 bg-blue-800 text-blue-100 text-xs px-2 py-0.5 rounded-full">
                    {patientGender}
                  </span>
                )}
              </p>
            ) : (
              <p className="text-blue-300 text-sm">Fill in the details below</p>
            )}
            {bookingId && (
              <span className="ml-auto text-xs text-blue-300 font-mono">ID: {bookingId}</span>
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="px-8 py-6 space-y-6">

            {/* ── Diagnosis ── */}
            <div>
              <Label>Diagnosis</Label>
              <AutocompleteInput
                value={diagnosisInput}
                onChange={handleDiagnosisSearch}
                suggestions={filteredDiseases}
                onSelect={(v) => { setDiagnosisInput(v); setFilteredDiseases([]); }}
                placeholder="Search or type diagnosis…"
              />
            </div>

            <Divider label="Symptoms" />

            {/* ── Symptoms ── */}
            <div>
              <Label>Add Symptoms</Label>
              <div className="flex gap-2">
                <AutocompleteInput
                  value={symptomInput}
                  onChange={handleSymptomSearch}
                  suggestions={formattedSymptomSuggestions}
                  onSelect={(v) => addSymptom(v)}
                  placeholder="Search symptom…"
                  className="flex-1"
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addSymptom(symptomInput); } }}
                />
                <button
                  type="button"
                  onClick={() => addSymptom(symptomInput)}
                  className="shrink-0 flex items-center gap-1 px-4 py-2 bg-[#0c213e] hover:bg-blue-800 text-white text-sm font-medium rounded-lg transition"
                >
                  <Plus size={14} /> Add
                </button>
              </div>
              {symptoms.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2.5 p-2.5 bg-blue-50 rounded-lg border border-blue-100">
                  {symptoms.map((s, i) => (
                    <Chip key={i} label={s} onRemove={() => setSymptoms((p) => p.filter((_, j) => j !== i))} color="blue" />
                  ))}
                </div>
              )}
            </div>

            <Divider label="Medicines" />

            {/* ── Medicines ── */}
            <div>
              <Label>Add Medicine</Label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div>
                  <p className="text-xs text-gray-400 mb-1">Name</p>
                  <AutocompleteInput
                    value={medicineName}
                    onChange={handleMedicineSearch}
                    suggestions={filteredMedicines}
                    onSelect={selectMedicine}
                    placeholder={loadingMedicines ? "Loading…" : "Medicine name"}
                    disabled={loadingMedicines}
                  />
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-1">Dosage</p>
                  <input
                    ref={dosageRef}
                    value={medicineDosage}
                    onChange={(e) => setMedicineDosage(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addMedicineChip(); } }}
                    placeholder="e.g. 500mg twice daily"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                  />
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-1">Quantity <span className="text-gray-300">(optional)</span></p>
                  <div className="flex gap-2">
                    <input
                      value={medicineQty}
                      onChange={(e) => setMedicineQty(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addMedicineChip(); } }}
                      placeholder="e.g. 10 tabs"
                      className="flex-1 min-w-0 border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                    />
                    <button
                      type="button"
                      onClick={addMedicineChip}
                      disabled={!medicineName.trim() || !medicineDosage.trim()}
                      title="Add medicine"
                      className="shrink-0 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-200 disabled:cursor-not-allowed text-white rounded-lg transition"
                    >
                      <Plus size={15} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Medicine list as a simple table */}
              {medicines.length > 0 && (
                <div className="mt-3 rounded-lg border border-gray-200 overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
                        <th className="text-left px-3 py-2 font-medium">Medicine</th>
                        <th className="text-left px-3 py-2 font-medium">Dosage</th>
                        <th className="text-left px-3 py-2 font-medium">Qty</th>
                        <th className="w-8 px-2 py-2"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {medicines.map((med, i) => (
                        <tr key={i} className="bg-white hover:bg-gray-50/50 transition-colors">
                          <td className="px-3 py-2.5 font-medium text-gray-800">{med.name}</td>
                          <td className="px-3 py-2.5 text-gray-600">{med.dosage}</td>
                          <td className="px-3 py-2.5 text-gray-400">{med.quantity || "—"}</td>
                          <td className="px-2 py-2.5 text-right">
                            <button
                              type="button"
                              onClick={() => setMedicines((p) => p.filter((_, j) => j !== i))}
                              className="text-gray-300 hover:text-red-400 transition-colors"
                            >
                              <X size={14} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <Divider label="Tests" />

            {/* ── Recommended Tests ── */}
            <div>
              <Label>Recommended Tests</Label>
              <div className="flex gap-2">
                <input
                  value={testInput}
                  onChange={(e) => setTestInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTest(); } }}
                  placeholder="e.g. Complete Blood Count, HbA1c…"
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                />
                <button
                  type="button"
                  onClick={addTest}
                  className="shrink-0 flex items-center gap-1 px-4 py-2 bg-[#0c213e] hover:bg-blue-800 text-white text-sm font-medium rounded-lg transition"
                >
                  <Plus size={14} /> Add
                </button>
              </div>
              {tests.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2.5 p-2.5 bg-violet-50 rounded-lg border border-violet-100">
                  {tests.map((t, i) => (
                    <Chip key={i} label={t} onRemove={() => setTests((p) => p.filter((_, j) => j !== i))} color="violet" />
                  ))}
                </div>
              )}
            </div>

            <Divider label="Notes" />

            {/* ── Notes ── */}
            <div>
              <Label optional>Additional Notes</Label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="Dietary advice, follow-up instructions, warnings…"
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition resize-none"
              />
            </div>

          </div>

          {/* Form Footer */}
          <div className="px-8 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
            <button
              type="button"
              className="px-5 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition"
            >
              Discard
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-6 py-2 bg-[#0c213e] hover:bg-blue-900 disabled:bg-blue-400 text-white text-sm font-semibold rounded-lg shadow-sm transition"
            >
              {loading ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Saving…
                </>
              ) : "Save Prescription"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PrescriptionForm;