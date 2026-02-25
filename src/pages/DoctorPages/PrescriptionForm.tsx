import React, { useEffect, useState, useMemo } from "react";
import { useLocation, useParams } from "react-router-dom";
import { X } from "lucide-react";
import api from "../../Services/mainApi";
import Swal from "sweetalert2";

// JSON Files
import diseaseData from "../../assets/Disease_symptom_dataset.json";
import symptomData from "../../assets/symptoms.json";

interface Medicine {
  name: string;
  dosage: string;
  quantity?: string;
}

const PrescriptionForm: React.FC = () => {
  const { bookingId, patientAadhar } = useParams();
  const doctorId = localStorage.getItem("doctorId") || undefined;
  const location = useLocation();

  // Move incoming state into guarded local state (avoid reading location.state directly during render)
  const [patientName, setPatientName] = useState<string | undefined>(
    () => (location.state as any)?.name
  );
  const [patientGender, setPatientGender] = useState<string | undefined>(
    () => (location.state as any)?.gender
  );

  // Diagnosis
  const [diagnosisInput, setDiagnosisInput] = useState("");
  const [allDiseases, setAllDiseases] = useState<string[]>([]);
  const [filteredDiseases, setFilteredDiseases] = useState<string[]>([]);
  const [showDiseaseSuggestions, setShowDiseaseSuggestions] =
    useState(false);

  // Symptoms
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [symptomInput, setSymptomInput] = useState("");
  const [allSymptoms, setAllSymptoms] = useState<string[]>([]);
  const [filteredSymptoms, setFilteredSymptoms] = useState<string[]>([]);
  const [showSymptoms, setShowSymptoms] = useState(false);

  // Tests
  const [tests, setTests] = useState<string[]>([]);
  const [testInput, setTestInput] = useState("");

  // Medicines
  const [medicineName, setMedicineName] = useState("");
  const [medicineDosage, setMedicineDosage] = useState("");
  const [medicineQty, setMedicineQty] = useState("");
  const [medicines, setMedicines] = useState<Medicine[]>([]);

  // Medicine list from API
  const [allMedicines, setAllMedicines] = useState<string[]>([]);
  const [filteredMedicines, setFilteredMedicines] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loadingMedicines, setLoadingMedicines] = useState(false);

  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  // Debugging: print params and incoming location.state once (helps confirm route matching)
  useEffect(() => {
    console.log("PrescriptionForm params:", { bookingId, patientAadhar });
    console.log("location.state:", location.state);
  }, [bookingId, patientAadhar, location.state]);

  // Fetch medicine list from API
  useEffect(() => {
    const fetchMedicineList = async () => {
      if (!doctorId) {
        console.warn("No doctorId found, skipping medicine list fetch");
        return;
      }

      setLoadingMedicines(true);
      try {
        const response = await api.get(`/api/doctor/medicine-list/${doctorId}`);
        console.log(response)
        
        if (response.data.success && Array.isArray(response.data.listOfMedicine)) {
          setAllMedicines(response.data.listOfMedicine);
          console.log("Fetched medicines:", response.data.listOfMedicine);
        } else {
          console.warn("Unexpected response format:", response.data);
          setAllMedicines([]);
        }
      } catch (error) {
        console.error("Error fetching medicine list:", error);
        // Fallback to default medicines if API fails
        setAllMedicines([
          "Paracetamol",
          "Ibuprofen",
          "Amoxicillin",
          "Cetirizine",
          "Azithromycin",
          "Dolo 650",
        ]);
      } finally {
        setLoadingMedicines(false);
      }
    };

    fetchMedicineList();
  }, [doctorId]);

  // Safely load all diseases from JSON once
  useEffect(() => {
    try {
      if (!Array.isArray(diseaseData)) {
        console.warn("diseaseData is not an array:", diseaseData);
        setAllDiseases([]);
        return;
      }

      const diseaseSet = new Set<string>();
      diseaseData.forEach((item: any) => {
        if (item && item.Disease) diseaseSet.add(String(item.Disease));
      });

      setAllDiseases(Array.from(diseaseSet));
    } catch (err) {
      console.error("Error parsing diseaseData:", err);
      setAllDiseases([]);
    }
  }, []);

  // Safely load all symptoms from JSON once
  useEffect(() => {
    try {
      if (!Array.isArray(symptomData) || symptomData.length === 0) {
        console.warn("symptomData unexpected format:", symptomData);
        setAllSymptoms([]);
        return;
      }

      const first = symptomData[0];
      if (typeof first !== "object" || first === null) {
        setAllSymptoms([]);
        return;
      }

      const symptomsList = Object.keys(first).filter(
        (key) => key !== "prognosis"
      );
      setAllSymptoms(symptomsList);
    } catch (err) {
      console.error("Error parsing symptomData:", err);
      setAllSymptoms([]);
    }
  }, []);

  // Format label helper
  const formatSymptomLabel = (symptom: string) =>
    symptom.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  // Symptom search (event-driven; does not cause render-loop)
  const handleSymptomSearch = (query: string) => {
    setSymptomInput(query);

    const trimmed = query.trim();
    if (!trimmed) {
      setFilteredSymptoms([]);
      setShowSymptoms(false);
      return;
    }

    const filtered = allSymptoms.filter((symptom) =>
      symptom.toLowerCase().startsWith(trimmed.toLowerCase())
    );

    setFilteredSymptoms(filtered.slice(0, 10));
    setShowSymptoms(true);
  };

  // Medicine search
  const handleMedicineSearch = (query: string) => {
    setMedicineName(query);

    if (!query.trim()) {
      setFilteredMedicines([]);
      setShowSuggestions(false);
      return;
    }

    const filtered = allMedicines.filter((m) =>
      m.toLowerCase().includes(query.toLowerCase())
    );

    setFilteredMedicines(filtered.slice(0, 10));
    setShowSuggestions(true);
  };

  const selectMedicine = (name: string) => {
    setMedicineName(name);
    setFilteredMedicines([]);
    setShowSuggestions(false);
  };

  // Diagnosis search
  const handleDiagnosisSearch = (query: string) => {
    setDiagnosisInput(query);

    const trimmed = query.trim();
    if (!trimmed) {
      setFilteredDiseases([]);
      setShowDiseaseSuggestions(false);
      return;
    }

    const filtered = allDiseases.filter((d) =>
      d.toLowerCase().startsWith(trimmed.toLowerCase())
    );

    setFilteredDiseases(filtered.slice(0, 10));
    setShowDiseaseSuggestions(true);
  };

  // Add / remove symptom
  const handleAddSymptom = () => {
    const val = symptomInput.trim();
    if (!val) return;
    setSymptoms((prev) => [...prev, formatSymptomLabel(val)]);
    setSymptomInput("");
    setFilteredSymptoms([]);
    setShowSymptoms(false);
  };

  const removeSymptom = (index: number) =>
    setSymptoms((prev) => prev.filter((_, i) => i !== index));

  // Add / remove test
  const handleAddTest = () => {
    const val = testInput.trim();
    if (!val) return;
    setTests((prev) => [...prev, val]);
    setTestInput("");
  };

  const removeTest = (index: number) =>
    setTests((prev) => prev.filter((_, i) => i !== index));

  // Add / remove medicine chip
  const addMedicineChip = () => {
    const name = medicineName.trim();
    const dosage = medicineDosage.trim();
    if (!name || !dosage) return;

    setMedicines((prev) => [
      ...prev,
      { name, dosage, quantity: medicineQty.trim() },
    ]);

    setMedicineName("");
    setMedicineDosage("");
    setMedicineQty("");
    setFilteredMedicines([]);
    setShowSuggestions(false);
  };

  const removeMedicine = (index: number) =>
    setMedicines((prev) => prev.filter((_, i) => i !== index));

  // Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Basic validation
    if (!bookingId) {
      Swal.fire({
        title: "Missing bookingId",
        text: "Missing booking id in the URL. Cannot save prescription.",
        icon: "error",
      });
      return;
    }

    setLoading(true);

    const payload = {
      doctorId,
      patientAadhar,
      diagnosis: diagnosisInput,
      symptoms,
      medicines,
      recommendedTests: tests,
      notes,
      name: patientName,
      gender: patientGender,
    };

    try {
      const url = `/api/prescription/addPrescription/${bookingId}`;
      console.log("Posting prescription to:", url, "payload:", payload);
      await api.post(url, payload);

      Swal.fire({
        title: "Prescription Saved Successfully!",
        icon: "success",
      });

      // reset form
      setDiagnosisInput("");
      setSymptoms([]);
      setTests([]);
      setMedicines([]);
      setNotes("");
    } catch (error) {
      console.error("Error saving prescription:", error);
      Swal.fire({
        title: "Error Saving Prescription",
        icon: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  // Optional: keep patientName/gender in sync if location.state changes (guarded to avoid loops)
  useEffect(() => {
    const s = (location.state as any) || {};
    if (s.name && s.name !== patientName) setPatientName(s.name);
    if (s.gender && s.gender !== patientGender) setPatientGender(s.gender);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state]); // only when location.state changes

  // Memoized formatted symptom suggestions (not required, but cheap)
  const formattedFilteredSymptoms = useMemo(
    () => filteredSymptoms.map((s) => formatSymptomLabel(s)),
    [filteredSymptoms]
  );

  return (
    <div className="max-w-5xl mx-auto p-6">
      <div className="bg-white rounded-2xl shadow-lg p-8">
        <h2 className="text-3xl font-bold text-center text-blue-900">
          Create Prescription
        </h2>

        <form onSubmit={handleSubmit} className="space-y-10">
          {/* Diagnosis */}
          <div>
            <h3 className="text-xl font-semibold text-gray-800 mb-4">
              Diagnosis
            </h3>

            <div className="relative w-full">
              <input
                className="border p-3 rounded-lg w-full"
                placeholder="Search diagnosis..."
                value={diagnosisInput}
                onChange={(e) => handleDiagnosisSearch(e.target.value)}
                onFocus={() =>
                  diagnosisInput && setShowDiseaseSuggestions(true)
                }
              />

              {showDiseaseSuggestions && filteredDiseases.length > 0 && (
                <div className="absolute bg-white border w-full rounded-lg shadow-lg max-h-60 overflow-y-auto z-50">
                  {filteredDiseases.map((disease, i) => (
                    <div
                      key={i}
                      className="p-3 cursor-pointer hover:bg-blue-100"
                      onClick={() => {
                        setDiagnosisInput(disease);
                        setShowDiseaseSuggestions(false);
                      }}
                    >
                      {disease}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Symptoms */}
          <div>
            <h3 className="text-xl font-semibold text-gray-800 mb-4">
              Symptoms
            </h3>

            <div className="relative flex gap-3">
              <input
                value={symptomInput}
                onChange={(e) => handleSymptomSearch(e.target.value)}
                onFocus={() => symptomInput && setShowSymptoms(true)}
                className="flex-1 border rounded-lg p-3"
                placeholder="Search symptom"
              />
              <button
                type="button"
                onClick={handleAddSymptom}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg"
              >
                Add
              </button>

              {showSymptoms && formattedFilteredSymptoms.length > 0 && (
                <div className="absolute left-0 top-14 bg-white border w-full rounded-lg shadow-lg max-h-60 overflow-y-auto z-50">
                  {formattedFilteredSymptoms.map((sym, idx) => (
                    <div
                      key={idx}
                      className="p-3 cursor-pointer hover:bg-blue-100"
                      onClick={() => {
                        // When user clicks a suggestion, add as the input value (user still needs to press Add)
                        setSymptomInput(sym);
                        setShowSymptoms(false);
                      }}
                    >
                      {sym}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-2 mt-3">
              {symptoms.map((s, i) => (
                <span
                  key={i}
                  className="flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm"
                >
                  {s}
                  <button
                    type="button"
                    onClick={() => removeSymptom(i)}
                    className="text-red-500"
                  >
                    <X size={16} />
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Medicines */}
          <div>
            <h3 className="text-xl font-semibold text-gray-800 mb-4">
              Medicines
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <input
                  value={medicineName}
                  onChange={(e) => handleMedicineSearch(e.target.value)}
                  onFocus={() => medicineName && setShowSuggestions(true)}
                  className="border rounded-lg p-3 w-full"
                  placeholder={loadingMedicines ? "Loading medicines..." : "Medicine name"}
                  disabled={loadingMedicines}
                />

                {showSuggestions && filteredMedicines.length > 0 && (
                  <div className="absolute z-20 bg-white border rounded-lg w-full max-h-60 overflow-y-auto shadow-lg">
                    {filteredMedicines.map((med, index) => (
                      <div
                        key={index}
                        onClick={() => selectMedicine(med)}
                        className="p-3 hover:bg-blue-100 cursor-pointer text-sm"
                      >
                        {med}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <input
                value={medicineDosage}
                onChange={(e) => setMedicineDosage(e.target.value)}
                className="border rounded-lg p-3"
                placeholder="Dosage"
              />

              <input
                value={medicineQty}
                onChange={(e) => setMedicineQty(e.target.value)}
                className="border rounded-lg p-3"
                placeholder="Quantity"
              />
            </div>

            <button
              type="button"
              onClick={addMedicineChip}
              className="mt-3 px-4 py-2 bg-green-600 text-white rounded-lg"
            >
              + Add Medicine
            </button>

            <div className="flex flex-wrap gap-2 mt-4">
              {medicines.map((med, i) => (
                <span
                  key={i}
                  className="flex items-center gap-2 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm"
                >
                  {med.name} — {med.dosage}{" "}
                  {med.quantity && ` — ${med.quantity}`}
                  <button
                    type="button"
                    onClick={() => removeMedicine(i)}
                    className="text-red-500"
                  >
                    <X size={16} />
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Tests */}
          <div>
            <h3 className="text-xl font-semibold text-gray-800 mb-4">
              Recommended Tests
            </h3>

            <div className="flex gap-3">
              <input
                value={testInput}
                onChange={(e) => setTestInput(e.target.value)}
                className="flex-1 border rounded-lg p-3"
                placeholder="Add test"
              />
              <button
                type="button"
                onClick={handleAddTest}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg"
              >
                Add
              </button>
            </div>

            <div className="flex flex-wrap gap-2 mt-3">
              {tests.map((t, i) => (
                <span
                  key={i}
                  className="flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm"
                >
                  {t}
                  <button
                    type="button"
                    onClick={() => removeTest(i)}
                    className="text-red-500"
                  >
                    <X size={16} />
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <h3 className="text-xl font-semibold text-gray-800 mb-4">
              Notes
            </h3>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              className="w-full border rounded-lg p-3"
              placeholder="Additional notes"
            ></textarea>
          </div>

          {/* Submit */}
          <div className="text-center">
            <button
              type="submit"
              disabled={loading}
              className={`px-8 py-3 rounded-xl text-lg font-medium text-white ${
                loading ? "bg-gray-500" : "bg-blue-700 hover:bg-blue-800"
              }`}
            >
              {loading ? "Saving..." : "Save Prescription"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PrescriptionForm;