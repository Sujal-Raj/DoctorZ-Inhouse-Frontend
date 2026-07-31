import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../Services/mainApi";
import toast from "react-hot-toast";
import {
  ArrowLeftIcon,
  HeartIcon,
  DocumentTextIcon,
  ClipboardDocumentCheckIcon,
  // PlusIcon,
} from "@heroicons/react/24/outline";

interface Patient {
  fullName: string;
  gender: string;
  age: number;
  mobileNumber: number;
}

interface Doctor {
  fullName: string;
}

interface Ward {
  name: string;
}

interface NursingNote {
  _id?: string;
  date: string;
  note: string;
  recordedBy: string;
}

interface VitalRecord {
  _id?: string;
  date: string;
  bp: string;
  temp: number;
  heartRate: number;
  spo2: number;
  recordedBy: string;
}

interface MARRecord {
  _id?: string;
  date: string;
  medicineName: string;
  dosage: string;
  status: "Given" | "Missed";
  administeredBy: string;
}

interface Admission {
  _id: string;
  patientId: Patient;
  doctorId: Doctor;
  wardId: Ward;
  bedNumber: string;
  admissionDate: string;
  status: string;
  reasonForAdmission: string;
  nursingNotes: NursingNote[];
  vitals: VitalRecord[];
  mar: MARRecord[];
}

export default function PatientCharting() {
  const { admissionId } = useParams<{ admissionId: string }>();
  const navigate = useNavigate();

  const [admission, setAdmission] = useState<Admission | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"vitals" | "mar" | "notes">("vitals");

  // Form inputs (Vitals)
  const [bp, setBp] = useState("");
  const [temp, setTemp] = useState("");
  const [heartRate, setHeartRate] = useState("");
  const [spo2, setSpo2] = useState("");
  const [vitalsRecorder, setVitalsRecorder] = useState("");

  // Form inputs (MAR)
  const [medicine, setMedicine] = useState("");
  const [dosage, setDosage] = useState("");
  const [marStatus, setMarStatus] = useState<"Given" | "Missed">("Given");
  const [marRecorder, setMarRecorder] = useState("");

  // Form inputs (Notes)
  const [nursingNote, setNursingNote] = useState("");
  const [noteRecorder, setNoteRecorder] = useState("");

  const fetchAdmission = async () => {
    try {
      setLoading(true);
      // const res = await api.get(`/api/ipd/admissions/detail/lookup`); // Wait! We can retrieve details from list or create details lookup!
      // Wait, we can fetch all admissions and filter by admissionId!
      const listRes = await api.get(`/api/ipd/admissions/${localStorage.getItem("clinicId")}`);
      if (listRes.data.success) {
        const found = listRes.data.admissions.find((a: any) => a._id === admissionId);
        if (found) {
          setAdmission(found);
        } else {
          toast.error("Admission record not found");
        }
      }
    } catch {
      toast.error("Failed to load charting logs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdmission();
  }, [admissionId]);

  const handleAddVitals = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bp || !temp || !heartRate || !spo2 || !vitalsRecorder) {
      toast.error("All vitals fields are required");
      return;
    }

    try {
      const res = await api.post(`/api/ipd/chart/vitals/${admissionId}`, {
        bp,
        temp,
        heartRate,
        spo2,
        recordedBy: vitalsRecorder,
      });

      if (res.data.success) {
        toast.success("Vitals entry recorded successfully");
        setBp("");
        setTemp("");
        setHeartRate("");
        setSpo2("");
        setVitalsRecorder("");
        fetchAdmission();
      }
    } catch {
      toast.error("Failed to record vitals log");
    }
  };

  const handleAddMAR = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!medicine || !dosage || !marRecorder) {
      toast.error("Medicine name, dosage, and nurse name are required");
      return;
    }

    try {
      const res = await api.post(`/api/ipd/chart/mar/${admissionId}`, {
        medicineName: medicine,
        dosage,
        status: marStatus,
        administeredBy: marRecorder,
      });

      if (res.data.success) {
        toast.success("Medication checklist updated");
        setMedicine("");
        setDosage("");
        setMarRecorder("");
        fetchAdmission();
      }
    } catch {
      toast.error("Failed to record MAR log");
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nursingNote || !noteRecorder) {
      toast.error("Note description and recorded by name are required");
      return;
    }

    try {
      const res = await api.post(`/api/ipd/chart/note/${admissionId}`, {
        note: nursingNote,
        recordedBy: noteRecorder,
      });

      if (res.data.success) {
        toast.success("Nursing note saved");
        setNursingNote("");
        setNoteRecorder("");
        fetchAdmission();
      }
    } catch {
      toast.error("Failed to save nursing note");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-10 h-10 border-4 border-slate-900 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!admission) {
    return (
      <div className="p-6 text-center text-gray-500">
        Admission details not found.
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 w-full font-sans text-gray-900">
      

      {/* Back button */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-gray-500 hover:text-gray-900 font-semibold text-sm cursor-pointer"
      >
        <ArrowLeftIcon className="w-4 h-4" />
        Back to Admissions
      </button>

      {/* Patient Banner */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <span className="text-[10px] bg-red-600 text-white font-bold uppercase tracking-wider px-2 py-0.5 rounded border border-red-500">
            Admitted Inpatient
          </span>
          <h2 className="text-2xl font-bold mt-1.5">{admission.patientId?.fullName}</h2>
          <p className="text-gray-300 text-xs mt-0.5">
            {admission.patientId?.gender}, {admission.patientId?.age} yrs • Mobile: {admission.patientId?.mobileNumber}
          </p>
        </div>
        <div className="flex gap-4 text-xs">
          <div>
            <span className="text-gray-400 block uppercase font-bold text-[9px] tracking-wider">Allocated Bed</span>
            <span className="font-semibold text-sm">{admission.wardId?.name} • Bed {admission.bedNumber}</span>
          </div>
          <div>
            <span className="text-gray-400 block uppercase font-bold text-[9px] tracking-wider">Physician In-Charge</span>
            <span className="font-semibold text-sm">Dr. {admission.doctorId?.fullName}</span>
          </div>
        </div>
      </div>

      {/* Workspace split */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Left Side: Chart Submissions */}
        <div className="bg-white rounded-2xl border border-gray-150 p-6 space-y-6 shadow-2xs h-fit">
          <div className="flex border-b border-gray-100 pb-3 gap-4">
            <button
              onClick={() => setActiveTab("vitals")}
              className={`pb-1 text-xs font-bold uppercase tracking-wider cursor-pointer ${
                activeTab === "vitals" ? "text-slate-950 border-b-2 border-slate-950" : "text-gray-400"
              }`}
            >
              Log Vitals
            </button>
            <button
              onClick={() => setActiveTab("mar")}
              className={`pb-1 text-xs font-bold uppercase tracking-wider cursor-pointer ${
                activeTab === "mar" ? "text-slate-950 border-b-2 border-slate-950" : "text-gray-400"
              }`}
            >
              Log MAR
            </button>
            <button
              onClick={() => setActiveTab("notes")}
              className={`pb-1 text-xs font-bold uppercase tracking-wider cursor-pointer ${
                activeTab === "notes" ? "text-slate-950 border-b-2 border-slate-950" : "text-gray-400"
              }`}
            >
              Log Note
            </button>
          </div>

          {activeTab === "vitals" && (
            <form onSubmit={handleAddVitals} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">Blood Pressure (BP)</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 120/80"
                  value={bp}
                  onChange={(e) => setBp(e.target.value)}
                  className="w-full border-2 border-gray-200 focus:border-[#0c213e] rounded-xl px-3.5 py-2 text-xs outline-none bg-gray-50/50"
                />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">Temp (°F)</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    placeholder="98.6"
                    value={temp}
                    onChange={(e) => setTemp(e.target.value)}
                    className="w-full border-2 border-gray-200 focus:border-[#0c213e] rounded-xl px-2 py-2 text-xs outline-none bg-gray-50/50"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">Heart (bpm)</label>
                  <input
                    type="number"
                    required
                    placeholder="72"
                    value={heartRate}
                    onChange={(e) => setHeartRate(e.target.value)}
                    className="w-full border-2 border-gray-200 focus:border-[#0c213e] rounded-xl px-2 py-2 text-xs outline-none bg-gray-50/50"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">SpO2 (%)</label>
                  <input
                    type="number"
                    required
                    placeholder="98"
                    value={spo2}
                    onChange={(e) => setSpo2(e.target.value)}
                    className="w-full border-2 border-gray-200 focus:border-[#0c213e] rounded-xl px-2 py-2 text-xs outline-none bg-gray-50/50"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">Recorded By *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Nurse Sarah"
                  value={vitalsRecorder}
                  onChange={(e) => setVitalsRecorder(e.target.value)}
                  className="w-full border-2 border-gray-200 focus:border-[#0c213e] rounded-xl px-3.5 py-2 text-xs outline-none bg-gray-50/50"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-[#0c213e] hover:bg-[#1a3a5f] text-white py-2 rounded-xl text-xs font-bold cursor-pointer transition-colors"
              >
                Log Vital Stats
              </button>
            </form>
          )}

          {activeTab === "mar" && (
            <form onSubmit={handleAddMAR} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">Medicine Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Paracetamol"
                  value={medicine}
                  onChange={(e) => setMedicine(e.target.value)}
                  className="w-full border-2 border-gray-200 focus:border-[#0c213e] rounded-xl px-3.5 py-2 text-xs outline-none bg-gray-50/50"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">Dosage *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 500mg"
                  value={dosage}
                  onChange={(e) => setDosage(e.target.value)}
                  className="w-full border-2 border-gray-200 focus:border-[#0c213e] rounded-xl px-3.5 py-2 text-xs outline-none bg-gray-50/50"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">Administration Status</label>
                <select
                  value={marStatus}
                  onChange={(e) => setMarStatus(e.target.value as any)}
                  className="w-full border-2 border-gray-200 focus:border-[#0c213e] rounded-xl px-3 py-2 text-xs outline-none bg-white"
                >
                  <option value="Given">Given</option>
                  <option value="Missed">Missed</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">Administered By *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Nurse Sarah"
                  value={marRecorder}
                  onChange={(e) => setMarRecorder(e.target.value)}
                  className="w-full border-2 border-gray-200 focus:border-[#0c213e] rounded-xl px-3.5 py-2 text-xs outline-none bg-gray-50/50"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-[#0c213e] hover:bg-[#1a3a5f] text-white py-2 rounded-xl text-xs font-bold cursor-pointer transition-colors"
              >
                Log Medication
              </button>
            </form>
          )}

          {activeTab === "notes" && (
            <form onSubmit={handleAddNote} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">Nursing Note note *</label>
                <textarea
                  required
                  placeholder="e.g. Patient slept well, complaining of mild headache in the morning."
                  value={nursingNote}
                  onChange={(e) => setNursingNote(e.target.value)}
                  rows={4}
                  className="w-full border-2 border-gray-200 focus:border-[#0c213e] rounded-xl p-3 text-xs outline-none resize-none bg-gray-50/50"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">Recorded By *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Nurse Sarah"
                  value={noteRecorder}
                  onChange={(e) => setNoteRecorder(e.target.value)}
                  className="w-full border-2 border-gray-200 focus:border-[#0c213e] rounded-xl px-3.5 py-2 text-xs outline-none bg-gray-50/50"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-[#0c213e] hover:bg-[#1a3a5f] text-white py-2 rounded-xl text-xs font-bold cursor-pointer transition-colors"
              >
                Log Nursing Note
              </button>
            </form>
          )}
        </div>

        {/* Right Side: Chart Visualizations & Lists */}
        <div className="md:col-span-2 space-y-6">
          
          {/* Section 1: Vital signs monitor */}
          <div className="bg-white rounded-2xl border border-gray-150 p-6 shadow-2xs space-y-4">
            <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
              <HeartIcon className="w-5 h-5 text-red-500" />
              <h3 className="text-base font-bold text-gray-900">Vital Signs Monitor</h3>
            </div>
            
            {admission.vitals?.length === 0 ? (
              <p className="text-xs text-gray-400 italic">No vitals logged during this admission.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {admission.vitals?.map((v, i) => (
                  <div key={i} className="bg-gray-50 border border-gray-150 p-4 rounded-xl text-xs space-y-2">
                    <div className="flex justify-between items-center text-gray-400 border-b border-gray-100 pb-1.5 font-semibold text-[10px] uppercase">
                      <span>{v.recordedBy}</span>
                      <span>{new Date(v.date).toLocaleDateString()}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-gray-700">
                      <div>BP: <strong className="text-gray-900">{v.bp}</strong></div>
                      <div>Temp: <strong className="text-gray-900">{v.temp}°F</strong></div>
                      <div>Pulse: <strong className="text-gray-900">{v.heartRate} bpm</strong></div>
                      <div>SpO2: <strong className="text-gray-900">{v.spo2}%</strong></div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section 2: Medication Log */}
          <div className="bg-white rounded-2xl border border-gray-150 p-6 shadow-2xs space-y-4">
            <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
              <ClipboardDocumentCheckIcon className="w-5 h-5 text-green-600" />
              <h3 className="text-base font-bold text-gray-900">Medication Administration Record (MAR)</h3>
            </div>

            {admission.mar?.length === 0 ? (
              <p className="text-xs text-gray-400 italic">No medication doses administered yet.</p>
            ) : (
              <div className="space-y-2.5">
                {admission.mar?.map((m, i) => (
                  <div key={i} className="flex justify-between items-center bg-gray-50 border border-gray-150 px-4 py-3 rounded-xl text-xs">
                    <div>
                      <h4 className="font-bold text-gray-900 text-sm">{m.medicineName} ({m.dosage})</h4>
                      <p className="text-gray-400 mt-0.5">Administered by {m.administeredBy} on {new Date(m.date).toLocaleDateString()}</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase border ${
                      m.status === "Given" ? "bg-green-50 text-green-700 border-green-200" : "bg-red-50 text-red-650 border-red-200"
                    }`}>
                      {m.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section 3: Nursing Notes timeline */}
          <div className="bg-white rounded-2xl border border-gray-150 p-6 shadow-2xs space-y-4">
            <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
              <DocumentTextIcon className="w-5 h-5 text-blue-600" />
              <h3 className="text-base font-bold text-gray-900">Nursing Notes Log</h3>
            </div>

            {admission.nursingNotes?.length === 0 ? (
              <p className="text-xs text-gray-400 italic">No nursing logs submitted.</p>
            ) : (
              <div className="relative border-l border-gray-200 ml-3 space-y-4 pt-1">
                {admission.nursingNotes?.map((n, i) => (
                  <div key={i} className="relative pl-5">
                    <span className="absolute -left-1.5 top-1.5 w-3 h-3 bg-blue-50 border-2 border-[#0c213e] rounded-full ring-4 ring-white" />
                    <div>
                      <p className="text-xs text-gray-400 font-semibold">{n.recordedBy} • {new Date(n.date).toLocaleDateString()}</p>
                      <p className="text-sm font-medium text-gray-700 mt-1">"{n.note}"</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
