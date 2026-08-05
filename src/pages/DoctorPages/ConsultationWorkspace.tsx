import React, { useEffect, useState, useMemo, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { 
  X, Plus, Search, FileText, Pill, Calendar, AlertCircle, 
  Printer, Download, Mail, Save, ArrowLeft, Copy, 
  Trash2, History, User, Activity, CheckCircle, RefreshCw,
  PlusCircle
} from "lucide-react";
import api from "../../Services/mainApi";
import Swal from "sweetalert2";

import diseaseData from "../../assets/Disease_symptom_dataset.json";
import symptomData from "../../assets/symptoms.json";

interface Medicine {
  name: string;
  dosage: string;
  quantity?: string;
  // Structured dosage details for editing/rendering
  structuredDosage?: {
    morning: boolean;
    afternoon: boolean;
    evening: boolean;
    night: boolean;
    timing: "before_food" | "after_food" | "empty_stomach" | "bedtime" | "";
    duration: string;
    durationUnit: "Days" | "Weeks" | "Months" | "L.S.";
    customInstructions?: string;
  };
}

interface PatientInfo {
  name: string;
  age: string | number;
  gender: string;
  mobileNumber: string;
  aadhar: string;
  dob?: string;
  patientId?: string;
  bloodGroup?: string;
}

interface EMRProfile {
  allergies: string[];
  diseases: string[];
  pastSurgeries: string[];
  currentMedications: string[];
  reports: string[];
}

interface PastPrescription {
  _id: string;
  createdAt: string;
  diagnosis: string;
  symptoms: string[];
  medicines: {
    name: string;
    dosage: string;
    quantity?: string;
  }[];
  recommendedTests?: string[];
  notes?: string;
  treatmentPlan?: string;
  followUp?: string;
  language?: string;
  doctorId: {
    fullName: string;
    specialization?: string;
  };
}

interface Template {
  name: string;
  diagnosis: string;
  symptoms: string[];
  medicines: Medicine[];
  notes: string;
  treatmentPlan: string;
  followUp: string;
}

// ─── Default Templates ────────────────────────────────────────────────────────
const BUILT_IN_TEMPLATES: Template[] = [
  {
    name: "Viral Fever Panel",
    diagnosis: "Viral Fever",
    symptoms: ["Fever", "Body Ache", "Headache", "Fatigue"],
    medicines: [
      { name: "Paracetamol 650mg", dosage: "1-0-1 | After Food | 5 Days", quantity: "10 Tabs" },
      { name: "Cetirizine 10mg", dosage: "0-0-1 | At Bedtime | 5 Days", quantity: "5 Tabs" },
      { name: "Amoxicillin 500mg", dosage: "1-0-1 | After Food | 5 Days", quantity: "10 Tabs" }
    ],
    notes: "Rest well, drink plenty of warm fluids.",
    treatmentPlan: "Symptomatic relief and antibacterial coverage.",
    followUp: "Review after 5 days if fever persists."
  },
  {
    name: "Hypertension Control",
    diagnosis: "Essential Hypertension",
    symptoms: ["Headache", "High Blood Pressure", "Dizziness"],
    medicines: [
      { name: "Amlodipine 5mg", dosage: "1-0-0 | Before Food | 30 Days", quantity: "30 Tabs" }
    ],
    notes: "Restricted sodium diet. Daily physical activity for 30 minutes.",
    treatmentPlan: "Long term blood pressure control.",
    followUp: "Review in 2 weeks with BP diary."
  },
  {
    name: "Type 2 Diabetes Routine",
    diagnosis: "Type 2 Diabetes Mellitus",
    symptoms: ["Increased Thirst", "Frequent Urination", "Fatigue"],
    medicines: [
      { name: "Metformin 500mg", dosage: "1-0-1 | After Food | 30 Days", quantity: "60 Tabs" }
    ],
    notes: "Avoid sweets and refined carbs. Regular blood sugar monitoring.",
    treatmentPlan: "Glycemic management.",
    followUp: "Review in 1 month with HbA1c report."
  }
];

export default function ConsultationWorkspace() {
  const { bookingId } = useParams<{ bookingId: string }>();
  const doctorId = localStorage.getItem("doctorId") || undefined;
  const location = useLocation();
  const navigate = useNavigate();

  // ─── Consultation State ──────────────────────────────────────────────────────
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [language, setLanguage] = useState<"en" | "hi">("en");
  
  const [patientInfo, setPatientInfo] = useState<PatientInfo>({
    name: "",
    age: "",
    gender: "",
    mobileNumber: "",
    aadhar: "",
  });
  
  const [emrProfile, setEmrProfile] = useState<EMRProfile>({
    allergies: [],
    diseases: [],
    pastSurgeries: [],
    currentMedications: [],
    reports: [],
  });

  const [pastPrescriptions, setPastPrescriptions] = useState<PastPrescription[]>([]);
  const [emrSearchQuery, setEmrSearchQuery] = useState("");

  const filteredPastPrescriptions = useMemo(() => {
    if (!emrSearchQuery.trim()) return pastPrescriptions;
    const q = emrSearchQuery.toLowerCase();
    return pastPrescriptions.filter((past) => {
      const matchDiag = past.diagnosis?.toLowerCase().includes(q);
      const matchNotes = past.notes?.toLowerCase().includes(q);
      const matchPlan = past.treatmentPlan?.toLowerCase().includes(q);
      const matchMeds = past.medicines?.some((m) => m.name.toLowerCase().includes(q));
      const matchSymp = past.symptoms?.some((s) => s.toLowerCase().includes(q));
      const matchTests = past.recommendedTests?.some((t) => t.toLowerCase().includes(q));
      return matchDiag || matchNotes || matchPlan || matchMeds || matchSymp || matchTests;
    });
  }, [pastPrescriptions, emrSearchQuery]);

  const displayAge = useMemo(() => {
    if (patientInfo.age) return `${patientInfo.age} Yrs`;
    if (patientInfo.dob) {
      try {
        const birthYear = new Date(patientInfo.dob).getFullYear();
        if (!isNaN(birthYear)) {
          return `${new Date().getFullYear() - birthYear} Yrs`;
        }
      } catch (e) {}
    }
    return "Age: N/A";
  }, [patientInfo.age, patientInfo.dob]);

  // ─── Active Prescription State ────────────────────────────────────────────────
  const [diagnosisInput, setDiagnosisInput] = useState("");
  const [allDiseases, setAllDiseases] = useState<string[]>([]);
  const [filteredDiseases, setFilteredDiseases] = useState<string[]>([]);

  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [symptomInput, setSymptomInput] = useState("");
  const [allSymptoms, setAllSymptoms] = useState<string[]>([]);
  const [filteredSymptoms, setFilteredSymptoms] = useState<string[]>([]);

  const [tests, setTests] = useState<string[]>([]);
  const [testInput, setTestInput] = useState("");

  const [notes, setNotes] = useState("");
  const [treatmentPlan, setTreatmentPlan] = useState("");
  const [followUp, setFollowUp] = useState("");

  // ─── Medicines Grid State ─────────────────────────────────────────────────────
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [medicineName, setMedicineName] = useState("");
  const [allMedicines, setAllMedicines] = useState<string[]>([]);
  const [filteredMedicines, setFilteredMedicines] = useState<string[]>([]);
  const [loadingMedicines, setLoadingMedicines] = useState(false);
  const [medicineQty, setMedicineQty] = useState("");

  // Structured dosage selections
  const [doseMorning, setDoseMorning] = useState(false);
  const [doseAfternoon, setDoseAfternoon] = useState(false);
  const [doseEvening, setDoseEvening] = useState(false);
  const [doseNight, setDoseNight] = useState(false);
  const [doseTiming, setDoseTiming] = useState<"before_food" | "after_food" | "empty_stomach" | "bedtime" | "">("");
  const [doseDuration, setDoseDuration] = useState("");
  const [doseDurationUnit, setDoseDurationUnit] = useState<"Days" | "Weeks" | "Months" | "L.S.">("Days");
  const [doseCustomInstructions, setDoseCustomInstructions] = useState("");

  // Template states
  const [customTemplates, setCustomTemplates] = useState<Template[]>([]);

  // Email Sharing Modal
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailInput, setEmailInput] = useState("");
  const [lastSavedPrescriptionId, setLastSavedPrescriptionId] = useState<string | null>(null);

  // ─── Initial Load ────────────────────────────────────────────────────────────
  useEffect(() => {
    const fetchAllDetails = async () => {
      if (!bookingId) return;
      try {
        setLoading(true);
        const res = await api.get(`/api/prescription/consultation-details/${bookingId}`);
        if (res.data.success) {
          setPatientInfo(res.data.patientInfo);
          setEmrProfile(res.data.emrProfile);
          setPastPrescriptions(res.data.pastPrescriptions);
          
          // Prefill default email if exists
          if (res.data.patientInfo.email) {
            setEmailInput(res.data.patientInfo.email);
          }
        }
      } catch (err) {
        console.error("Error fetching consultation details:", err);
        // Fallback to location state if API fails
        const s = (location.state as any) || {};
        setPatientInfo({
          name: s.name || "Unknown Patient",
          gender: s.gender || "",
          mobileNumber: s.mobileNumber || "",
          aadhar: "",
          age: "",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchAllDetails();
  }, [bookingId, location.state]);

  // ─── Dictionary Loading ─────────────────────────────────────────────────────
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
        setAllMedicines(["Paracetamol", "Ibuprofen", "Amoxicillin", "Cetirizine", "Azithromycin", "Dolo 650", "Metformin", "Amlodipine", "Pantocid"]);
      } finally {
        setLoadingMedicines(false);
      }
    };
    fetchMedicines();

    // Load custom templates from localStorage
    try {
      const stored = localStorage.getItem(`custom_templates_${doctorId}`);
      if (stored) {
        setCustomTemplates(JSON.parse(stored));
      }
    } catch (e) {
      console.error(e);
    }
  }, [doctorId]);

  useEffect(() => {
    try {
      if (Array.isArray(diseaseData)) {
        const set = new Set<string>();
        diseaseData.forEach((item: any) => item?.Disease && set.add(String(item.Disease)));
        setAllDiseases(Array.from(set));
      }
    } catch { setAllDiseases([]); }
  }, []);

  useEffect(() => {
    try {
      if (Array.isArray(symptomData) && symptomData.length) {
        const first = symptomData[0];
        if (typeof first === "object" && first) {
          setAllSymptoms(Object.keys(first).filter((k) => k !== "prognosis"));
        }
      }
    } catch { setAllSymptoms([]); }
  }, []);

  // ─── Helper Formats ──────────────────────────────────────────────────────────
  const fmt = (s: string) => s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  const formatDate = (dateStr?: string, id?: string) => {
    if (dateStr) {
      const d = new Date(dateStr);
      if (!isNaN(d.getTime())) {
        return d.toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric"
        });
      }
    }
    if (id && id.length === 24) {
      try {
        const d = new Date(parseInt(id.substring(0, 8), 16) * 1000);
        if (!isNaN(d.getTime())) {
          return d.toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric"
          });
        }
      } catch (e) {
        // ignore
      }
    }
    return "Unknown Date";
  };

  // ─── Search Handlers ─────────────────────────────────────────────────────────
  const handleDiagnosisSearch = (q: string) => {
    setDiagnosisInput(q);
    if (!q.trim()) { setFilteredDiseases([]); return; }
    setFilteredDiseases(allDiseases.filter((d) => d.toLowerCase().startsWith(q.toLowerCase())).slice(0, 8));
  };

  const handleSymptomSearch = (q: string) => {
    setSymptomInput(q);
    if (!q.trim()) { setFilteredSymptoms([]); return; }
    setFilteredSymptoms(allSymptoms.filter((s) => s.toLowerCase().startsWith(q.toLowerCase())).slice(0, 8));
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
    setFilteredMedicines(allMedicines.filter((m) => m.toLowerCase().includes(q.toLowerCase())).slice(0, 8));
  };

  const selectMedicine = (name: string) => {
    setMedicineName(name);
    setFilteredMedicines([]);
  };

  const addTest = () => {
    const val = testInput.trim();
    if (!val || tests.includes(val)) return;
    setTests((p) => [...p, val]);
    setTestInput("");
  };

  // ─── Dosage Compiling ────────────────────────────────────────────────────────
  const compileDosageString = () => {
    const freq = [doseMorning ? "1" : "0", doseAfternoon ? "1" : "0", doseEvening ? "1" : "0", doseNight ? "1" : "0"].join("-");
    const frequencyText = freq === "0-0-0-0" ? "" : freq;

    let timingStr = "";
    if (doseTiming === "before_food") timingStr = language === "hi" ? "भोजन से पहले" : "Before Food";
    else if (doseTiming === "after_food") timingStr = language === "hi" ? "भोजन के बाद" : "After Food";
    else if (doseTiming === "empty_stomach") timingStr = language === "hi" ? "खाली पेट" : "Empty Stomach";
    else if (doseTiming === "bedtime") timingStr = language === "hi" ? "सोते समय" : "At Bedtime";

    let durationStr = "";
    if (doseDuration) {
      let unit = doseDurationUnit;
      if (language === "hi") {
        if (unit === "Days") unit = "दिन" as any;
        else if (unit === "Weeks") unit = "सप्ताह" as any;
        else if (unit === "Months") unit = "महीने" as any;
      }
      durationStr = `${doseDuration} ${unit}`;
    } else if (doseDurationUnit === "L.S.") {
      durationStr = language === "hi" ? "ज़रूरत के अनुसार (L.S.)" : "As Needed (L.S.)";
    }

    const parts = [frequencyText, timingStr, durationStr, doseCustomInstructions].filter(Boolean);
    return parts.join(" | ");
  };

  const addMedicineChip = () => {
    const name = medicineName.trim();
    if (!name) return;

    const compiledDosage = compileDosageString();

    const newMed: Medicine = {
      name,
      dosage: compiledDosage || "As directed by doctor",
      quantity: medicineQty.trim() || undefined,
      structuredDosage: {
        morning: doseMorning,
        afternoon: doseAfternoon,
        evening: doseEvening,
        night: doseNight,
        timing: doseTiming,
        duration: doseDuration,
        durationUnit: doseDurationUnit,
        customInstructions: doseCustomInstructions,
      }
    };

    setMedicines((p) => [...p, newMed]);
    
    // Reset dosage sub-inputs
    setMedicineName("");
    setMedicineQty("");
    setDoseMorning(false);
    setDoseAfternoon(false);
    setDoseEvening(false);
    setDoseNight(false);
    setDoseTiming("");
    setDoseDuration("");
    setDoseDurationUnit("Days");
    setDoseCustomInstructions("");
  };

  // ─── EMR Timeline Copy Handlers ──────────────────────────────────────────────
  const handleCopyPrescription = (past: PastPrescription) => {
    // Add all medicines from the past prescription
    const newMeds: Medicine[] = past.medicines.map((m) => ({
      name: m.name,
      dosage: m.dosage,
      quantity: m.quantity
    }));
    setMedicines(newMeds);
    
    if (past.diagnosis) setDiagnosisInput(past.diagnosis);
    if (past.symptoms) setSymptoms(past.symptoms);
    if (past.recommendedTests) setTests(past.recommendedTests);
    if (past.notes) setNotes(past.notes);
    if (past.treatmentPlan) setTreatmentPlan(past.treatmentPlan);
    if (past.followUp) setFollowUp(past.followUp);

    Swal.fire({
      toast: true,
      position: "top-end",
      icon: "success",
      title: "Previous Rx items copied!",
      showConfirmButton: false,
      timer: 2000
    });
  };

  // ─── Template Management ────────────────────────────────────────────────────
  const handleApplyTemplate = (tpl: Template) => {
    setDiagnosisInput(tpl.diagnosis);
    setSymptoms(tpl.symptoms);
    setMedicines(tpl.medicines);
    setNotes(tpl.notes);
    setTreatmentPlan(tpl.treatmentPlan);
    setFollowUp(tpl.followUp);

    Swal.fire({
      toast: true,
      position: "top-end",
      icon: "success",
      title: `Template "${tpl.name}" applied!`,
      showConfirmButton: false,
      timer: 2000
    });
  };

  const handleSaveAsTemplate = () => {
    if (!diagnosisInput.trim()) {
      Swal.fire({ title: "Template requires diagnosis", icon: "warning" });
      return;
    }

    Swal.fire({
      title: "Save as Custom Template",
      input: "text",
      inputPlaceholder: "Enter template name...",
      showCancelButton: true,
      confirmButtonText: "Save",
      confirmButtonColor: "#0c213e",
      inputValidator: (value) => {
        if (!value) return "Template name is required";
      }
    }).then((result) => {
      if (result.isConfirmed && result.value) {
        const newTpl: Template = {
          name: result.value,
          diagnosis: diagnosisInput,
          symptoms,
          medicines,
          notes,
          treatmentPlan,
          followUp
        };
        
        const updated = [...customTemplates, newTpl];
        setCustomTemplates(updated);
        localStorage.setItem(`custom_templates_${doctorId}`, JSON.stringify(updated));

        Swal.fire({ title: "Template Saved!", icon: "success", confirmButtonColor: "#0c213e" });
      }
    });
  };

  // ─── Submission Logic ────────────────────────────────────────────────────────
  const savePrescriptionToDB = async () => {
    if (!bookingId) {
      Swal.fire({ title: "Missing bookingId", icon: "error" });
      return null;
    }
    setSaving(true);
    const payload = {
      doctorId,
      patientAadhar: patientInfo.aadhar,
      diagnosis: diagnosisInput,
      symptoms,
      medicines,
      recommendedTests: tests,
      notes,
      treatmentPlan,
      followUp,
      language,
      name: patientInfo.name,
      gender: patientInfo.gender,
      mobileNumber: patientInfo.mobileNumber
    };

    try {
      const res = await api.post(`/api/prescription/addPrescription/${bookingId}`, payload);
      if (res.data.data) {
        // Mark prescribed locally
        const doneIds = JSON.parse(localStorage.getItem("doctorPrescribedBookingIds") || "[]") as string[];
        if (!doneIds.includes(bookingId)) {
          localStorage.setItem("doctorPrescribedBookingIds", JSON.stringify([...doneIds, bookingId]));
        }
        setLastSavedPrescriptionId(res.data.data._id);
        return res.data.data;
      }
      return null;
    } catch (err: any) {
      console.error(err);
      Swal.fire({
        title: "Error Saving Prescription",
        text: err.response?.data?.message || err.message || "Failed to connect to server",
        icon: "error"
      });
      return null;
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAndClose = async () => {
    const rx = await savePrescriptionToDB();
    if (rx) {
      Swal.fire({ title: "Prescription Saved!", icon: "success", confirmButtonColor: "#0c213e" }).then(() => {
        if (doctorId) navigate(`/doctordashboard/${doctorId}/appointments`, { replace: true });
      });
    }
  };

  const handlePrintLocal = () => {
    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "0";
    document.body.appendChild(iframe);
    
    const doc = iframe.contentWindow?.document || iframe.contentDocument;
    if (doc) {
      const labels = language === "hi" ? {
        title: "पर्ची (Prescription)",
        patientDetails: "मरीज का विवरण",
        name: "नाम",
        gender: "लिंग",
        aadhar: "आधार / पहचान पत्र",
        diagnosis: "निदान (Diagnosis)",
        symptoms: "लक्षण (Symptoms)",
        medicines: "दवाइयाँ (Medicines)",
        medName: "दवा का नाम",
        dosage: "खुराक (Dosage)",
        quantity: "मात्रा (Qty)",
        tests: "अनुशंसित परीक्षण",
        treatmentPlan: "उपचार योजना",
        followUp: "अगली मुलाक़ात / निर्देश",
        notes: "टिप्पणी"
      } : {
        title: "Prescription",
        patientDetails: "Patient Details",
        name: "Name",
        gender: "Gender",
        aadhar: "Aadhar / Patient ID",
        diagnosis: "Diagnosis",
        symptoms: "Symptoms",
        medicines: "Medicines",
        medName: "Medicine Name",
        dosage: "Dosage",
        quantity: "Quantity",
        tests: "Recommended Tests",
        treatmentPlan: "Treatment Plan",
        followUp: "Follow-up Instructions",
        notes: "Notes"
      };

      const htmlContent = `
        <html>
        <head>
          <meta charset="utf-8">
          <title>${labels.title}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 40px; color: #333; line-height: 1.5; }
            h1 { color: #0c213e; border-bottom: 2px solid #0c213e; padding-bottom: 10px; margin-top: 0; text-align: center; }
            .section { margin-bottom: 25px; }
            .section h3 { color: #0c213e; margin-bottom: 8px; border-bottom: 1px solid #eee; padding-bottom: 4px; font-size: 16px; text-transform: uppercase; }
            .details-grid { display: grid; grid-template-cols: 1fr 1fr; gap: 10px; background: #f8fafc; padding: 15px; border-radius: 8px; margin-bottom: 20px; border: 1px solid #e2e8f0; }
            .details-grid p { margin: 0; font-size: 14px; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            table, th, td { border: 1px solid #cbd5e1; padding: 10px; text-align: left; }
            th { background-color: #f1f5f9; color: #0c213e; font-weight: bold; font-size: 13px; }
            td { font-size: 14px; }
            ul { margin: 0; padding-left: 20px; }
            li { font-size: 14px; margin-bottom: 4px; }
            p { font-size: 14px; }
            .footer { text-align: center; margin-top: 50px; font-size: 12px; color: #777; border-top: 1px solid #eee; padding-top: 10px; }
          </style>
        </head>
        <body>
          <h1>${labels.title}</h1>
          
          <div class="details-grid">
            <p><strong>${labels.name}:</strong> ${patientInfo.name}</p>
            <p><strong>${labels.gender}:</strong> ${patientInfo.gender}</p>
            <p><strong>${labels.aadhar}:</strong> ${patientInfo.aadhar || "—"}</p>
            <p><strong>Mobile:</strong> ${patientInfo.mobileNumber || "—"}</p>
          </div>

          <div class="section">
            <h3>${labels.diagnosis}</h3>
            <p>${diagnosisInput || "—"}</p>
          </div>

          ${symptoms.length > 0 ? `
          <div class="section">
            <h3>${labels.symptoms}</h3>
            <ul>
              ${symptoms.map(s => `<li>${s}</li>`).join("")}
            </ul>
          </div>` : ""}

          <div class="section">
            <h3>${labels.medicines}</h3>
            <table>
              <tr>
                <th>${labels.medName}</th>
                <th>${labels.dosage}</th>
                <th>${labels.quantity}</th>
              </tr>
              ${medicines.map(m => `
                <tr>
                  <td><strong>${m.name}</strong></td>
                  <td>${m.dosage}</td>
                  <td>${m.quantity || "—"}</td>
                </tr>
              `).join("")}
            </table>
          </div>

          ${tests.length > 0 ? `
          <div class="section">
            <h3>${labels.tests}</h3>
            <ul>
              ${tests.map(t => `<li>${t}</li>`).join("")}
            </ul>
          </div>` : ""}

          ${treatmentPlan ? `
          <div class="section">
            <h3>${labels.treatmentPlan}</h3>
            <p>${treatmentPlan}</p>
          </div>` : ""}

          ${followUp ? `
          <div class="section">
            <h3>${labels.followUp}</h3>
            <p>${followUp}</p>
          </div>` : ""}

          ${notes ? `
          <div class="section">
            <h3>${labels.notes}</h3>
            <p>${notes}</p>
          </div>` : ""}

          <div class="footer">
            Generated on ${new Date().toLocaleString("en-IN")} via DoctorZ EMR Platform.
          </div>
        </body>
        </html>
      `;

      doc.write(htmlContent);
      doc.close();

      setTimeout(() => {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
        setTimeout(() => {
          document.body.removeChild(iframe);
        }, 3000);
      }, 500);
    }
  };

  const handleSaveAndPrint = async () => {
    handlePrintLocal();
    await savePrescriptionToDB();
    if (doctorId) {
      navigate(`/doctordashboard/${doctorId}/appointments`, { replace: true });
    }
  };

  const handleSaveAndEmail = async () => {
    const rx = await savePrescriptionToDB();
    if (rx) {
      setLastSavedPrescriptionId(rx._id);
      setShowEmailModal(true);
    }
  };

  const handleSendEmail = async () => {
    if (!lastSavedPrescriptionId || !emailInput.trim()) return;
    try {
      setSaving(true);
      const res = await api.post("/api/prescription/send-email", {
        prescriptionId: lastSavedPrescriptionId,
        email: emailInput.trim()
      });
      if (res.data.success) {
        Swal.fire({ title: "Email Sent Successfully!", icon: "success", confirmButtonColor: "#0c213e" });
        setShowEmailModal(false);
        if (doctorId) navigate(`/doctordashboard/${doctorId}/appointments`, { replace: true });
      }
    } catch (err) {
      console.error(err);
      Swal.fire({ title: "Failed to send email", icon: "error" });
    } finally {
      setSaving(false);
    }
  };

  // ─── Suggestions Formats ─────────────────────────────────────────────────────
  const formattedSymptomSuggestions = useMemo(() => filteredSymptoms.map(fmt), [filteredSymptoms]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px]">
        <RefreshCw className="w-10 h-10 text-[#0c213e] animate-spin mb-4" />
        <p className="text-gray-500 font-medium">Loading Patient Consultation Workspace...</p>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col min-h-screen bg-gray-50/50 pb-20 font-[Poppins]">
      
      {/* ─── Sticky Patient Clinical Header ───────────────────────────────────── */}
      <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-200 px-6 py-4 shadow-sm">
        <div className="max-w-full w-full mx-auto px-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          {/* Patient Bio */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-50 text-[#0c213e] rounded-full flex items-center justify-center font-bold text-lg border border-blue-100">
              {patientInfo.name ? patientInfo.name.charAt(0).toUpperCase() : <User />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-gray-900 capitalize">{patientInfo.name}</h2>
                <span className="px-2 py-0.5 bg-gray-100 text-gray-700 text-xs font-semibold rounded-md border border-gray-200">
                  {displayAge} • {patientInfo.gender}
                </span>
                {patientInfo.bloodGroup && (
                  <span className="px-2 py-0.5 bg-red-50 text-red-700 text-xs font-bold rounded-md border border-red-100">
                    Blood: {patientInfo.bloodGroup}
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 font-medium">
                Phone: <span className="text-gray-800">{patientInfo.mobileNumber || "N/A"}</span> | 
                Aadhar ID: <span className="text-gray-800">{patientInfo.aadhar || "N/A"}</span>
              </p>
            </div>
          </div>

          {/* Vitals Summary */}
          <div className="flex flex-wrap items-center gap-4 bg-gray-50 p-2.5 rounded-xl border border-gray-200">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 px-2.5 py-1 border-r border-gray-200 last:border-0">
              <Activity className="w-3.5 h-3.5 text-red-500" />
              <span>Vitals:</span>
              <span className="text-gray-950 font-bold">Stable</span>
            </div>
            {emrProfile.allergies.length > 0 ? (
              <div className="flex items-center gap-1.5 bg-red-50 border border-red-200 px-2.5 py-1 rounded-lg text-xs text-red-800 font-bold animate-pulse">
                <AlertCircle className="w-4 h-4 text-red-600" />
                <span>Allergies: {emrProfile.allergies.join(", ")}</span>
              </div>
            ) : (
              <div className="flex items-center gap-1 bg-green-50 border border-green-200 px-2.5 py-1 rounded-lg text-xs text-green-700 font-bold">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span>No Known Allergies</span>
              </div>
            )}
          </div>

          {/* Language Switcher */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">Language:</span>
            <div className="inline-flex rounded-lg border border-gray-300 p-0.5 bg-gray-100">
              <button
                type="button"
                onClick={() => setLanguage("en")}
                className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${language === "en" ? "bg-white text-[#0c213e] shadow" : "text-gray-500 hover:text-gray-800"}`}
              >
                English
              </button>
              <button
                type="button"
                onClick={() => setLanguage("hi")}
                className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${language === "hi" ? "bg-white text-[#0c213e] shadow" : "text-gray-500 hover:text-gray-800"}`}
              >
                हिन्दी
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* ─── Split-Screen Workspace Layout ───────────────────────────────────── */}
      <div className="max-w-full w-full mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 p-6 flex-1">
        
        {/* ─── Left Sidebar: Patient Timeline / History (35% Width) ────────────── */}
        <div className="lg:col-span-4 flex flex-col gap-6 h-[calc(100vh-160px)] lg:sticky lg:top-28">
          
          {/* Clinical Profile Vitals summary card */}
          <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-xs">
            <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2 mb-3">
              <Activity className="w-4 h-4 text-blue-600" />
              Patient Clinical Summary
            </h3>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-gray-50 p-2.5 rounded-lg border border-gray-100">
                <span className="text-gray-400 block mb-0.5">Chronic Diseases</span>
                <span className="font-semibold text-gray-800">
                  {emrProfile.diseases.length > 0 ? emrProfile.diseases.join(", ") : "None Reported"}
                </span>
              </div>
              <div className="bg-gray-50 p-2.5 rounded-lg border border-gray-100">
                <span className="text-gray-400 block mb-0.5">Past Surgeries</span>
                <span className="font-semibold text-gray-800">
                  {emrProfile.pastSurgeries.length > 0 ? emrProfile.pastSurgeries.join(", ") : "None"}
                </span>
              </div>
              <div className="bg-gray-50 p-2.5 rounded-lg border border-gray-100">
                <span className="text-gray-400 block mb-0.5">Current Meds</span>
                <span className="font-semibold text-gray-800">
                  {emrProfile.currentMedications.length > 0 ? emrProfile.currentMedications.join(", ") : "None"}
                </span>
              </div>
              <div className="bg-gray-50 p-2.5 rounded-lg border border-gray-100">
                <span className="text-gray-400 block mb-0.5">Vitals Status</span>
                <span className="font-bold text-green-600">Stable</span>
              </div>
            </div>
          </div>

          {/* Timeline Feed */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-xs flex-1 flex flex-col overflow-hidden">
            <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                <History className="w-4 h-4 text-blue-600" />
                EMR Timeline & Visit History
              </h3>
              <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                {pastPrescriptions.length} visits
              </span>
            </div>

            {/* Search Input for EMR Timeline */}
            {pastPrescriptions.length > 0 && (
              <div className="px-4 py-2.5 border-b border-gray-150 bg-white">
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-gray-400" />
                  <input
                    value={emrSearchQuery}
                    onChange={(e) => setEmrSearchQuery(e.target.value)}
                    placeholder="Search EMR diagnosis, medicines..."
                    className="w-full pl-9 pr-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 bg-gray-50/50"
                  />
                </div>
              </div>
            )}

            {/* Scrollable list */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {filteredPastPrescriptions.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center p-6 text-gray-400">
                  <FileText className="w-12 h-12 stroke-[1.5] mb-2 text-gray-300" />
                  <p className="text-xs font-semibold">No Matching Clinical Records</p>
                  <p className="text-[10px] mt-1 text-gray-400">Try adjusting your EMR search query.</p>
                </div>
              ) : (
                filteredPastPrescriptions.map((past) => (
                  <div key={past._id} className="relative pl-4 border-l-2 border-blue-500/30 last:border-0 pb-1">
                    {/* timeline node icon */}
                    <div className="absolute -left-[7px] top-1.5 w-3 h-3 bg-blue-600 rounded-full border-2 border-white shadow-xs" />
                    
                    <div className="bg-gray-50/40 hover:bg-gray-50/80 p-3 rounded-xl border border-gray-200 transition-colors">
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <div>
                          <span className="text-[11px] font-bold text-blue-700">{formatDate(past.createdAt, past._id)}</span>
                          <span className="text-[10px] block text-gray-400">Dr. {past.doctorId?.fullName}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleCopyPrescription(past)}
                          title="Copy details to current workspace"
                          className="flex items-center gap-1 px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 text-[10px] font-bold rounded-md transition"
                        >
                          <Copy size={11} /> Copy Rx
                        </button>
                      </div>

                      {/* Clinical info snippets */}
                      <div className="space-y-1.5 text-xs text-gray-700">
                        {past.diagnosis && (
                          <p>
                            <span className="font-semibold text-gray-800">Diag:</span> {past.diagnosis}
                          </p>
                        )}
                        {past.symptoms && past.symptoms.length > 0 && (
                          <p>
                            <span className="font-semibold text-gray-800">Symptoms:</span> {past.symptoms.join(", ")}
                          </p>
                        )}
                        {past.medicines && past.medicines.length > 0 && (
                          <div>
                            <span className="font-semibold text-gray-800">Medicines:</span>
                            <ul className="list-disc pl-4 mt-0.5 text-[11px] text-gray-600">
                              {past.medicines.map((m, idx) => (
                                <li key={idx}>
                                  <strong>{m.name}</strong> - {m.dosage} {m.quantity ? `(${m.quantity})` : ""}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {past.recommendedTests && past.recommendedTests.length > 0 && (
                          <p>
                            <span className="font-semibold text-gray-800">Tests:</span> {past.recommendedTests.join(", ")}
                          </p>
                        )}
                        {past.treatmentPlan && (
                          <p>
                            <span className="font-semibold text-gray-800">Plan:</span> {past.treatmentPlan}
                          </p>
                        )}
                        {past.followUp && (
                          <p>
                            <span className="font-semibold text-gray-800">Follow-up:</span> {past.followUp}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

        {/* ─── Right Pane: Active Workspace Form (65% Width) ────────────────────── */}
        <div className="lg:col-span-8 space-y-6">

          {/* Form Header with Quick templates */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 pb-4 border-b border-gray-100">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Clinical Consultation</h2>
                <p className="text-xs text-gray-500">Document patient signs, diagnose, and structure prescription details.</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSaveAsTemplate}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold rounded-lg transition"
                >
                  <Save size={13} /> Save Template
                </button>
              </div>
            </div>

            {/* Quick Templates Selector */}
            <div className="mb-4">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                Select Clinical Template / Presets:
              </label>
              <div className="flex flex-wrap gap-2">
                {BUILT_IN_TEMPLATES.map((tpl, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleApplyTemplate(tpl)}
                    className="px-3 py-1.5 bg-blue-50/50 hover:bg-blue-50 text-blue-700 text-xs font-bold rounded-lg border border-blue-100 transition-colors"
                  >
                    {tpl.name}
                  </button>
                ))}
                {customTemplates.map((tpl, i) => (
                  <button
                    key={`custom-${i}`}
                    type="button"
                    onClick={() => handleApplyTemplate(tpl)}
                    className="px-3 py-1.5 bg-emerald-50/50 hover:bg-emerald-50 text-emerald-700 text-xs font-bold rounded-lg border border-emerald-100 transition-colors"
                  >
                    {tpl.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Diagnosis & Symptoms Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">Diagnosis</label>
                <div className="relative">
                  <input
                    value={diagnosisInput}
                    onChange={(e) => handleDiagnosisSearch(e.target.value)}
                    placeholder="Search or type diagnosis..."
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                  />
                  {filteredDiseases.length > 0 && (
                    <ul className="absolute left-0 top-full mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto z-50 py-1">
                      {filteredDiseases.map((d, i) => (
                        <li
                          key={i}
                          onClick={() => { setDiagnosisInput(d); setFilteredDiseases([]); }}
                          className="px-3 py-2 text-sm cursor-pointer hover:bg-blue-50 hover:text-blue-700 text-gray-700 transition"
                        >
                          {d}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">Add Symptoms</label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      value={symptomInput}
                      onChange={(e) => handleSymptomSearch(e.target.value)}
                      placeholder="Type & press enter to add..."
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addSymptom(symptomInput);
                        }
                      }}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                    />
                    {filteredSymptoms.length > 0 && (
                      <ul className="absolute left-0 top-full mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto z-50 py-1">
                        {formattedSymptomSuggestions.map((s, i) => (
                          <li
                            key={i}
                            onClick={() => addSymptom(s)}
                            className="px-3 py-2 text-sm cursor-pointer hover:bg-blue-50 hover:text-blue-700 text-gray-700 transition"
                          >
                            {s}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => addSymptom(symptomInput)}
                    className="shrink-0 px-4 py-2 bg-[#0c213e] hover:bg-blue-900 text-white text-sm font-bold rounded-lg transition"
                  >
                    Add
                  </button>
                </div>
                {symptoms.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2.5 p-2 bg-blue-50/50 rounded-lg border border-blue-100">
                    {symptoms.map((s, i) => (
                      <span key={i} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold border bg-blue-50 text-blue-800 border-blue-200">
                        {s}
                        <button type="button" onClick={() => setSymptoms((p) => p.filter((_, j) => j !== i))} className="hover:text-red-600">
                          <X size={12} strokeWidth={2.5} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* Medicines Grid Workspace */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs space-y-6">
            <div>
              <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <Pill className="w-5 h-5 text-emerald-600" />
                Medications & Prescription Grid
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">Search drugs and prescribe with precise frequencies & timing instructions.</p>
            </div>

            {/* Smart Medicine Add Row */}
            <div className="bg-gray-50/50 p-4 rounded-xl border border-gray-200/80 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                {/* Medicine Search */}
                <div className="md:col-span-5 relative">
                  <label className="block text-xs font-bold text-gray-500 mb-1">DRUG NAME</label>
                  <input
                    value={medicineName}
                    onChange={(e) => handleMedicineSearch(e.target.value)}
                    placeholder={loadingMedicines ? "Loading..." : "Search medicine name..."}
                    disabled={loadingMedicines}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition"
                  />
                  {filteredMedicines.length > 0 && (
                    <ul className="absolute left-0 top-full mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto z-50 py-1">
                      {filteredMedicines.map((m, i) => (
                        <li
                          key={i}
                          onClick={() => selectMedicine(m)}
                          className="px-3 py-2 text-sm cursor-pointer hover:bg-blue-50 hover:text-blue-700 text-gray-700 transition"
                        >
                          {m}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* Qty Input */}
                <div className="md:col-span-3">
                  <label className="block text-xs font-bold text-gray-500 mb-1">QUANTITY</label>
                  <input
                    value={medicineQty}
                    onChange={(e) => setMedicineQty(e.target.value)}
                    placeholder="e.g. 10 tabs, 1 bottle"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition"
                  />
                </div>

                {/* Duration */}
                <div className="md:col-span-4">
                  <label className="block text-xs font-bold text-gray-500 mb-1">DURATION</label>
                  <div className="flex gap-1.5">
                    <input
                      type="number"
                      value={doseDuration}
                      onChange={(e) => setDoseDuration(e.target.value)}
                      placeholder="No."
                      min="1"
                      className="w-16 border border-gray-300 rounded-lg px-2 py-2 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-center transition"
                    />
                    <select
                      value={doseDurationUnit}
                      onChange={(e) => setDoseDurationUnit(e.target.value as any)}
                      className="flex-1 border border-gray-300 rounded-lg px-2.5 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition"
                    >
                      <option value="Days">Days</option>
                      <option value="Weeks">Weeks</option>
                      <option value="Months">Months</option>
                      <option value="L.S.">L.S. (As Needed)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Dosage selection details */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-3 pt-2">
                {/* Frequency checkboxes */}
                <div className="md:col-span-6">
                  <label className="block text-xs font-bold text-gray-500 mb-1.5">FREQUENCY</label>
                  <div className="flex gap-2">
                    {[
                      { key: "m", label: "M", title: "Morning", state: doseMorning, setter: setDoseMorning },
                      { key: "a", label: "A", title: "Afternoon", state: doseAfternoon, setter: setDoseAfternoon },
                      { key: "e", label: "E", title: "Evening", state: doseEvening, setter: setDoseEvening },
                      { key: "n", label: "N", title: "Night", state: doseNight, setter: setDoseNight },
                    ].map((item) => (
                      <button
                        key={item.key}
                        type="button"
                        onClick={() => item.setter(!item.state)}
                        title={item.title}
                        className={`w-10 h-10 rounded-lg border flex items-center justify-center font-bold text-sm transition-all ${item.state ? "bg-emerald-600 border-emerald-600 text-white shadow-sm" : "bg-white text-gray-500 hover:border-gray-400"}`}
                      >
                        {item.label}
                      </button>
                    ))}
                    <div className="flex items-center text-xs text-gray-400 ml-1.5">
                      ({[doseMorning ? "1" : "0", doseAfternoon ? "1" : "0", doseEvening ? "1" : "0", doseNight ? "1" : "0"].join("-")})
                    </div>
                  </div>
                </div>

                {/* Timing selector */}
                <div className="md:col-span-6">
                  <label className="block text-xs font-bold text-gray-500 mb-1.5">TIMING</label>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { val: "before_food", label: "AC", title: "Before Food" },
                      { val: "after_food", label: "PC", title: "After Food" },
                      { val: "empty_stomach", label: "Empty Stomach", title: "Empty Stomach" },
                      { val: "bedtime", label: "Bedtime", title: "At Bedtime" },
                    ].map((t) => (
                      <button
                        key={t.val}
                        type="button"
                        onClick={() => setDoseTiming(doseTiming === t.val ? "" : (t.val as any))}
                        title={t.title}
                        className={`px-3 py-2 rounded-lg text-xs font-bold border transition ${doseTiming === t.val ? "bg-[#0c213e] border-[#0c213e] text-white" : "bg-white text-gray-600 hover:border-gray-400"}`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Instructions and Add button */}
              <div className="flex flex-col sm:flex-row items-end gap-3 pt-2">
                <div className="flex-1 w-full">
                  <label className="block text-xs font-bold text-gray-500 mb-1">CUSTOM INSTRUCTIONS / DRUG ADVICE</label>
                  <input
                    value={doseCustomInstructions}
                    onChange={(e) => setDoseCustomInstructions(e.target.value)}
                    placeholder="e.g. Dissolve in half glass water, take with milk..."
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition"
                  />
                </div>
                <button
                  type="button"
                  onClick={addMedicineChip}
                  disabled={!medicineName.trim()}
                  className="w-full sm:w-auto shrink-0 flex items-center justify-center gap-1.5 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-200 disabled:cursor-not-allowed text-white text-sm font-bold rounded-lg transition"
                >
                  <PlusCircle size={16} /> Add Medicine
                </button>
              </div>

            </div>

            {/* Medicines List Table */}
            {medicines.length > 0 ? (
              <div className="rounded-xl border border-gray-200 overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 text-xs text-gray-600 font-bold uppercase tracking-wider">
                      <th className="px-4 py-3 font-semibold">#</th>
                      <th className="px-4 py-3 font-semibold">Medicine Name</th>
                      <th className="px-4 py-3 font-semibold">Dosage / Freq / Duration / Instruction</th>
                      <th className="px-4 py-3 font-semibold text-center w-28">Quantity</th>
                      <th className="px-4 py-3 w-12"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {medicines.map((med, i) => (
                      <tr key={i} className="bg-white hover:bg-gray-50/50 transition-colors">
                        <td className="px-4 py-3.5 text-gray-400 font-bold">{i + 1}</td>
                        <td className="px-4 py-3.5 font-bold text-gray-900">{med.name}</td>
                        <td className="px-4 py-3.5 text-gray-700">{med.dosage}</td>
                        <td className="px-4 py-3.5 text-center text-gray-500 font-medium bg-gray-50/20">{med.quantity || "—"}</td>
                        <td className="px-4 py-3.5 text-center">
                          <button
                            type="button"
                            onClick={() => setMedicines((p) => p.filter((_, j) => j !== i))}
                            className="text-gray-300 hover:text-red-600 transition-colors p-1"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-8 border border-dashed border-gray-300 rounded-xl text-gray-400">
                <Pill className="w-10 h-10 stroke-[1.5] text-gray-300 mb-2" />
                <p className="text-xs font-semibold">No Medicines Prescribed Yet</p>
                <p className="text-[10px] text-gray-400 mt-0.5">Use the medication builder above to prescribe drugs.</p>
              </div>
            )}

          </div>

          {/* Investigations & Clinical Advice */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs space-y-4">
            
            {/* Investigations */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">Recommended Tests & Labs</label>
              <div className="flex gap-2">
                <input
                  value={testInput}
                  onChange={(e) => setTestInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTest(); } }}
                  placeholder="e.g. Complete Blood Count, Urine Routine, HbA1c..."
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                />
                <button
                  type="button"
                  onClick={addTest}
                  className="shrink-0 px-4 py-2 bg-[#0c213e] hover:bg-blue-900 text-white text-sm font-bold rounded-lg transition"
                >
                  Add Test
                </button>
              </div>
              {tests.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2.5 p-2 bg-violet-50/50 rounded-lg border border-violet-100">
                  {tests.map((t, i) => (
                    <span key={i} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold border bg-violet-50 text-violet-850 border-violet-200">
                      {t}
                      <button type="button" onClick={() => setTests((p) => p.filter((_, j) => j !== i))} className="hover:text-red-600">
                        <X size={12} strokeWidth={2.5} />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Plan, follow-up, advice */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">Treatment Plan</label>
                <textarea
                  value={treatmentPlan}
                  onChange={(e) => setTreatmentPlan(e.target.value)}
                  rows={2}
                  placeholder="Short term goal, drug titration schedule, dietary guidance..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">Follow-up Instructions</label>
                <input
                  value={followUp}
                  onChange={(e) => setFollowUp(e.target.value)}
                  placeholder="e.g. Review after 1 week, SOS if severe pain..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                />
              </div>
            </div>

            {/* Additional Clinical Notes */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">Clinical Notes (Optional)</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="Doctor internal observations, warnings, or dietary advice..."
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition resize-none"
              />
            </div>

          </div>

        </div>

      </div>

      {/* ─── Bottom Fixed Actions Bar ─────────────────────────────────────────── */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 shadow-lg px-6 py-4">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          
          <button
            type="button"
            onClick={() => {
              if (doctorId) navigate(`/doctordashboard/${doctorId}/appointments`);
            }}
            className="flex items-center gap-1 px-4 py-2 text-sm font-bold text-gray-600 hover:text-gray-900 border border-gray-300 rounded-xl hover:bg-gray-50 transition"
          >
            <ArrowLeft size={16} /> Exit Workspace
          </button>

          <div className="flex items-center gap-2">
            
            <button
              type="button"
              disabled={saving || medicines.length === 0}
              onClick={handleSaveAndEmail}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-blue-50 hover:bg-blue-100 disabled:bg-gray-100 disabled:text-gray-400 text-blue-700 text-sm font-bold border border-blue-200 rounded-xl transition"
            >
              <Mail size={16} /> Email to Patient
            </button>

            <button
              type="button"
              disabled={saving || medicines.length === 0}
              onClick={handleSaveAndPrint}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-violet-50 hover:bg-violet-100 disabled:bg-gray-100 disabled:text-gray-400 text-violet-750 text-sm font-bold border border-violet-200 rounded-xl transition"
            >
              <Printer size={16} /> Print Prescription
            </button>

            <button
              type="button"
              disabled={saving || medicines.length === 0}
              onClick={handleSaveAndClose}
              className="flex items-center gap-1.5 px-6 py-2.5 bg-[#0c213e] hover:bg-blue-900 disabled:bg-blue-450 text-white text-sm font-bold rounded-xl shadow-md transition"
            >
              {saving ? "Saving..." : "Save Prescription"}
            </button>

          </div>

        </div>
      </div>

      {/* ─── Email Verification Modal ─────────────────────────────────────────── */}
      {showEmailModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-xl border border-gray-100 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-bold text-gray-900">Email Prescription</h3>
              <button onClick={() => setShowEmailModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>
            
            <p className="text-xs text-gray-500">
              Verify the patient's email address below to send their prescription.
            </p>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-gray-600">Patient's Email</label>
              <input
                type="email"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder="Enter patient email address..."
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3">
              <button
                type="button"
                onClick={() => setShowEmailModal(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 text-sm font-bold rounded-xl hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSendEmail}
                disabled={saving || !emailInput.trim()}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-xl shadow-md transition"
              >
                {saving ? "Sending..." : "Send Email"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
